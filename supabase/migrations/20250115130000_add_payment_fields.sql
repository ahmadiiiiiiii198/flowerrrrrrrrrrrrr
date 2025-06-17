-- Add payment-related fields to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session_id ON orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_payment_intent_id ON orders(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);

-- Add comments for documentation
COMMENT ON COLUMN orders.stripe_session_id IS 'Stripe checkout session ID';
COMMENT ON COLUMN orders.stripe_payment_intent_id IS 'Stripe payment intent ID';
COMMENT ON COLUMN orders.payment_status IS 'Payment status: pending, paid, failed, refunded';
COMMENT ON COLUMN orders.paid_amount IS 'Amount actually paid (may differ from total_amount due to discounts)';
COMMENT ON COLUMN orders.paid_at IS 'Timestamp when payment was completed';

-- Update existing orders to have payment_status = 'pending' if null
UPDATE orders 
SET payment_status = 'pending' 
WHERE payment_status IS NULL;
