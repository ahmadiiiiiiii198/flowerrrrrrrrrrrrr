import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Get Stripe configuration from database
    const { data: configData, error: configError } = await supabaseClient
      .from('settings')
      .select('value')
      .eq('key', 'stripeConfig')
      .single()

    if (configError || !configData?.value) {
      throw new Error('Stripe configuration not found')
    }

    const stripeConfig = configData.value as any
    if (!stripeConfig.secretKey) {
      throw new Error('Stripe secret key not configured')
    }

    // Initialize Stripe with config from database
    const stripe = new Stripe(stripeConfig.secretKey, {
      apiVersion: '2023-10-16',
    })

    // Get session_id from query parameters
    const url = new URL(req.url)
    const sessionId = url.searchParams.get('session_id')

    if (!sessionId) {
      throw new Error('Missing session_id parameter')
    }

    console.log('Verifying payment for session:', sessionId)

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    console.log('Session retrieved:', {
      id: session.id,
      payment_status: session.payment_status,
      payment_intent: session.payment_intent,
    })

    // Get payment intent details if payment was successful
    let paymentIntent = null
    if (session.payment_intent && typeof session.payment_intent === 'string') {
      paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent)
    }

    const response = {
      status: session.payment_status,
      paymentIntentId: session.payment_intent,
      customerEmail: session.customer_email,
      amountTotal: session.amount_total,
      currency: session.currency,
      metadata: session.metadata,
      paymentIntent: paymentIntent ? {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      } : null,
    }

    console.log('Payment verification response:', response)

    return new Response(
      JSON.stringify(response),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error verifying payment:', error)
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
