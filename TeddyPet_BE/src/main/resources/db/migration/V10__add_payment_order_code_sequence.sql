CREATE SEQUENCE IF NOT EXISTS payment_order_code_seq START WITH 2000000;

-- Update orders status check constraint to include REFUND_PENDING and REFUNDED
DO $$ 
BEGIN 
    -- Drop old constraint if exists (try common names or search by definition)
    ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
    
    -- Add new constraint with REFUND_PENDING and REFUNDED
    ALTER TABLE orders ADD CONSTRAINT orders_status_check 
    CHECK (status IN ('PENDING','CONFIRMED','PAID','PROCESSING','DELIVERING','DELIVERED','COMPLETED','CANCELLED','REFUND_PENDING','REFUNDED','RETURN_REQUESTED','RETURNED'));
END $$;
