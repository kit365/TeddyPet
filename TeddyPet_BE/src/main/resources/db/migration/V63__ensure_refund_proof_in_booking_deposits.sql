-- Ensure refund_proof column exists (entity expects it; may have been dropped by an earlier migration)
ALTER TABLE booking_deposits
ADD COLUMN IF NOT EXISTS refund_proof VARCHAR(500);
