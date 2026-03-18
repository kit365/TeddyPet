ALTER TABLE booking_deposits
    ADD COLUMN IF NOT EXISTS payos_order_code BIGINT,
    ADD COLUMN IF NOT EXISTS checkout_url VARCHAR(512);

CREATE INDEX IF NOT EXISTS idx_booking_deposits_payos_order_code
    ON booking_deposits (payos_order_code);

