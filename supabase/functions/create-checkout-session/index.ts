import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@13.11.0'

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

    const { 
      line_items, 
      customer_email, 
      success_url, 
      cancel_url, 
      metadata,
      payment_intent_data 
    } = await req.json()

    console.log('Creating checkout session for:', { customer_email, metadata })

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      customer_email,
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['IT', 'FR', 'DE', 'ES', 'AT', 'CH'],
      },
      success_url,
      cancel_url,
      metadata,
      payment_intent_data,
    })

    console.log('Checkout session created:', session.id)

    return new Response(
      JSON.stringify({ 
        id: session.id, 
        url: session.url 
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error creating checkout session:', error)
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
