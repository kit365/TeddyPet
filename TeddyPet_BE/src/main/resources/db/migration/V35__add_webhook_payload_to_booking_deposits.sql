ALTER TABLE IF EXISTS booking_deposits
ADD COLUMN IF NOT EXISTS webhook_payload TEXT;
