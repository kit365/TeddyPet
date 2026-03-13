ALTER TABLE booking_pet_service_items
DROP CONSTRAINT IF EXISTS fk_bpsi_parent_service;

ALTER TABLE staff_profiles
DROP CONSTRAINT IF EXISTS fk_staff_profiles_secondary_position;

ALTER TABLE service_room_types
DROP CONSTRAINT IF EXISTS service_room_types_room_type_id_fkey;

ALTER TABLE service_room_types
DROP CONSTRAINT IF EXISTS service_room_types_service_id_fkey;

ALTER TABLE admin_google_whitelist
    ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITHOUT TIME ZONE;

ALTER TABLE admin_google_whitelist
    ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);

ALTER TABLE admin_google_whitelist
    ADD COLUMN IF NOT EXISTS invitation_token VARCHAR(255);

ALTER TABLE admin_google_whitelist
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

ALTER TABLE admin_google_whitelist
    ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

ALTER TABLE admin_google_whitelist
    ADD COLUMN IF NOT EXISTS status VARCHAR(255) DEFAULT 'PENDING';

ALTER TABLE admin_google_whitelist
    ADD COLUMN IF NOT EXISTS token_expired_at TIMESTAMP WITHOUT TIME ZONE;

ALTER TABLE admin_google_whitelist
    ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);

ALTER TABLE admin_google_whitelist
    ALTER COLUMN is_active SET NOT NULL;

ALTER TABLE admin_google_whitelist
    ALTER COLUMN is_deleted SET NOT NULL;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT FALSE;

-- Use DO block for unique constraint to avoid error if exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uc_admin_google_whitelist_invitation_token') THEN
        ALTER TABLE admin_google_whitelist ADD CONSTRAINT uc_admin_google_whitelist_invitation_token UNIQUE (invitation_token);
    END IF;
END $$;

DROP TABLE staff_profiles_hire_date_backup CASCADE;

ALTER TABLE users
DROP COLUMN IF EXISTS has_password;

ALTER TABLE users
DROP COLUMN IF EXISTS is_guest;

ALTER TABLE booking_deposits
DROP COLUMN IF EXISTS refund_proof;

ALTER TABLE staff_profiles
DROP COLUMN IF EXISTS secondary_position_id;

ALTER TABLE bookings
DROP COLUMN IF EXISTS source;

ALTER TABLE admin_google_whitelist
    ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE shipping_rules
ALTER
COLUMN fee_per_km TYPE DECIMAL USING (fee_per_km::DECIMAL);

ALTER TABLE shipping_rules
ALTER
COLUMN fixed_fee TYPE DECIMAL USING (fixed_fee::DECIMAL);

ALTER TABLE shipping_rules
ALTER
COLUMN free_ship_threshold TYPE DECIMAL USING (free_ship_threshold::DECIMAL);

ALTER TABLE booking_deposits
ALTER
COLUMN hold_payload TYPE VARCHAR(255) USING (hold_payload::VARCHAR(255));

ALTER TABLE shipping_rules
ALTER
COLUMN min_fee TYPE DECIMAL USING (min_fee::DECIMAL);

ALTER TABLE shipping_rules
ALTER
COLUMN over_weight_fee TYPE DECIMAL USING (over_weight_fee::DECIMAL);

ALTER TABLE booking_deposits
    ALTER COLUMN reminder_sent SET NOT NULL;

ALTER TABLE admin_google_whitelist
ALTER
COLUMN role TYPE VARCHAR(255) USING (role::VARCHAR(255));

ALTER TABLE admin_google_whitelist
    ALTER COLUMN updated_at SET NOT NULL;