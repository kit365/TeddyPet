ALTER TABLE booking_deposits
ADD COLUMN IF NOT EXISTS webhook_payload TEXT;
