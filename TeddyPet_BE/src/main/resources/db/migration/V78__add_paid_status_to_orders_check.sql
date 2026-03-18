-- Ensure the orders.status CHECK constraint allows the new PAID status
-- This aligns the database constraint with the Java enum OrderStatusEnum,
-- which now includes: PENDING, CONFIRMED, PAID, PROCESSING, DELIVERING, DELIVERED,
-- COMPLETED, CANCELLED, RETURN_REQUESTED, RETURNED.

ALTER TABLE orders
    DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders
    ADD CONSTRAINT orders_status_check
        CHECK (status IN (
            'PENDING',
            'CONFIRMED',
            'PAID',
            'PROCESSING',
            'DELIVERING',
            'DELIVERED',
            'COMPLETED',
            'CANCELLED',
            'RETURN_REQUESTED',
            'RETURNED'
        ));

