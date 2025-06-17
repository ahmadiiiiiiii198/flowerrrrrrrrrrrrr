# Stripe Payment Integration for Francesco Fiori & Piante

This document explains how to set up and use the Stripe payment integration for the Francesco Fiori & Piante flower store website.

## Overview

The integration includes:
- **Stripe Checkout** for secure payment processing
- **Supabase Edge Functions** for server-side Stripe operations
- **Payment status tracking** in the database
- **Webhook handling** for payment confirmations
- **Order management** with payment states

## Architecture

```
Frontend (React) → Supabase Edge Functions → Stripe API → Database Updates
                ↓
            Stripe Checkout Page
                ↓
        Payment Success/Cancel Pages
```

## Setup Instructions

### 1. Stripe Account Setup

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Get your API keys from the Stripe Dashboard:
   - **Publishable Key** (starts with `pk_test_` for test mode)
   - **Secret Key** (starts with `sk_test_` for test mode)
3. Set up webhooks in Stripe Dashboard:
   - Endpoint URL: `https://your-supabase-project.supabase.co/functions/v1/stripe-webhook`
   - Events to listen for:
     - `checkout.session.completed`
     - `payment_intent.payment_failed`

### 2. Environment Variables

Create a `.env.local` file in your project root:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://despodpgvkszyexvcbft.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe Configuration (Frontend)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
```

### 3. Supabase Edge Functions Setup

Deploy the Edge Functions to your Supabase project:

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref despodpgvkszyexvcbft

# Deploy Edge Functions
supabase functions deploy create-checkout-session
supabase functions deploy verify-payment
supabase functions deploy stripe-webhook
```

### 4. Supabase Secrets Configuration

Set the required secrets for your Edge Functions:

```bash
# Set Stripe secret key
supabase secrets set STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here

# Set webhook secret (from Stripe Dashboard)
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Set Supabase service role key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## Features

### 1. Product Order with Payment

- Customers can order products through the `ProductOrderModal`
- Two payment options:
  - **Pay Now**: Immediate Stripe checkout
  - **Pay Later**: Traditional order submission

### 2. Stripe Checkout Flow

1. Customer fills order form
2. Clicks "Pay Now" 
3. Order is created in database with `payment_pending` status
4. Redirected to Stripe Checkout
5. After payment:
   - Success → Order status updated to `paid`
   - Cancel → Order status remains `payment_pending`

### 3. Payment Status Tracking

Orders have the following payment-related fields:
- `payment_status`: `pending`, `paid`, `failed`, `refunded`
- `stripe_session_id`: Stripe checkout session ID
- `stripe_payment_intent_id`: Stripe payment intent ID
- `paid_amount`: Actual amount paid
- `paid_at`: Payment completion timestamp

### 4. Webhook Integration

Stripe webhooks automatically update order status:
- `checkout.session.completed` → Updates order to `paid`
- `payment_intent.payment_failed` → Updates order to `payment_failed`

## Testing

### 1. Test Button

Use the Stripe Test Button in the Admin Panel:
- Navigate to `/admin`
- Click "Test Stripe Checkout"
- This will create a test checkout session

### 2. Test Cards

Use Stripe's test card numbers:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

### 3. Test Mode

Ensure you're using test keys (`pk_test_` and `sk_test_`) for development.

## File Structure

```
src/
├── services/
│   └── stripeService.ts          # Stripe integration service
├── components/
│   ├── StripeCheckout.tsx        # Stripe checkout component
│   ├── StripeTestButton.tsx      # Test button for admin
│   └── ProductOrderModal.tsx     # Updated with payment options
├── pages/
│   ├── PaymentSuccess.tsx        # Payment success page
│   └── PaymentCancel.tsx         # Payment cancel page
└── api/
    └── stripe.ts                 # API utilities (if needed)

supabase/
├── functions/
│   ├── create-checkout-session/  # Creates Stripe checkout sessions
│   ├── verify-payment/           # Verifies payment status
│   └── stripe-webhook/           # Handles Stripe webhooks
└── migrations/
    └── 20250115130000_add_payment_fields.sql
```

## Security Considerations

1. **Never expose secret keys** in frontend code
2. **Use HTTPS** for all webhook endpoints
3. **Verify webhook signatures** to ensure authenticity
4. **Validate payment amounts** server-side
5. **Use test mode** during development

## Troubleshooting

### Common Issues

1. **Webhook not receiving events**:
   - Check webhook URL in Stripe Dashboard
   - Verify endpoint is accessible
   - Check webhook secret configuration

2. **Payment not updating order**:
   - Check webhook logs in Supabase
   - Verify order ID in session metadata
   - Check database permissions

3. **Checkout session creation fails**:
   - Verify Stripe keys are correct
   - Check Edge Function logs
   - Ensure all required fields are provided

### Debug Mode

Enable debug logging by checking browser console and Supabase Edge Function logs.

## Production Deployment

1. Replace test keys with live Stripe keys
2. Update webhook URLs to production endpoints
3. Test thoroughly with small amounts
4. Monitor webhook delivery and order updates

## Support

For issues with this integration:
1. Check Stripe Dashboard for payment details
2. Review Supabase Edge Function logs
3. Verify database order status
4. Contact support if needed

---

**Note**: This integration is designed for the Francesco Fiori & Piante flower store and uses Supabase as the backend infrastructure.
