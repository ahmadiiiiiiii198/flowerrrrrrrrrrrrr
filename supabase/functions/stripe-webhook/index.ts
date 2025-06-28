import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const signature = req.headers.get('stripe-signature')
    const body = await req.text()
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

    if (!signature || !webhookSecret) {
      throw new Error('Missing stripe signature or webhook secret')
    }

    // Verify the webhook signature
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)

    console.log('Received Stripe webhook:', event.type)

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        console.log('Checkout session completed:', session.id)

        // Get order ID from metadata
        const orderId = session.metadata?.order_id
        if (!orderId) {
          console.error('No order_id in session metadata')
          break
        }

        // Update order status in database (only if currently payment_pending)
        const { error: updateError } = await supabaseClient
          .from('orders')
          .update({
            status: 'paid',
            payment_status: 'paid',
            stripe_session_id: session.id,
            stripe_payment_intent_id: session.payment_intent as string,
            paid_amount: (session.amount_total || 0) / 100, // Convert from cents
            paid_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId)
          .eq('status', 'payment_pending') // Only update if currently waiting for payment

        if (updateError) {
          console.error('Error updating order:', updateError)
          throw updateError
        }

        // Create order status history entry
        const { error: historyError } = await supabaseClient
          .from('order_status_history')
          .insert({
            order_id: orderId,
            status: 'paid',
            notes: `Payment completed via Stripe. Session: ${session.id}`,
            created_by: 'stripe_webhook',
          })

        if (historyError) {
          console.error('Error creating status history:', historyError)
        }

        console.log('Order updated successfully:', orderId)
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log('Payment failed:', paymentIntent.id)

        // Find order by payment intent ID
        const { data: orders, error: findError } = await supabaseClient
          .from('orders')
          .select('id')
          .eq('stripe_payment_intent_id', paymentIntent.id)
          .limit(1)

        if (findError || !orders || orders.length === 0) {
          console.error('Could not find order for failed payment:', paymentIntent.id)
          break
        }

        const orderId = orders[0].id

        // Update order status
        const { error: updateError } = await supabaseClient
          .from('orders')
          .update({
            status: 'payment_failed',
            payment_status: 'failed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId)

        if (updateError) {
          console.error('Error updating failed payment order:', updateError)
          throw updateError
        }

        // Create order status history entry
        const { error: historyError } = await supabaseClient
          .from('order_status_history')
          .insert({
            order_id: orderId,
            status: 'payment_failed',
            notes: `Payment failed. Payment Intent: ${paymentIntent.id}. Reason: ${paymentIntent.last_payment_error?.message || 'Unknown'}`,
            created_by: 'stripe_webhook',
          })

        if (historyError) {
          console.error('Error creating failed payment history:', historyError)
        }

        console.log('Failed payment order updated:', orderId)
        break
      }

      default:
        console.log('Unhandled event type:', event.type)
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message 
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 400,
      },
    )
  }
})
