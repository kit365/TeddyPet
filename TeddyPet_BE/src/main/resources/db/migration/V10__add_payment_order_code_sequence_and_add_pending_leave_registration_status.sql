-- === Merged from: V10__add_payment_order_code_sequence.sql ===
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


-- === Merged from: V10__add_pending_leave_registration_status.sql ===
-- Allow PENDING_LEAVE status for work_shift_registrations.status (xin nghá»‰ chá» admin duyá»‡t)

DO $$
DECLARE c RECORD;
BEGIN
    FOR c IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'work_shift_registrations'::regclass
          AND contype = 'c'
          AND pg_get_constraintdef(oid) ILIKE '%status%'
    LOOP
        EXECUTE format('ALTER TABLE work_shift_registrations DROP CONSTRAINT IF EXISTS %I', c.conname);
    END LOOP;
END $$;

ALTER TABLE work_shift_registrations
    ADD CONSTRAINT work_shift_registrations_status_check
        CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'PENDING_LEAVE', 'ON_LEAVE'));


