-- Ensure staff_profiles.secondary_position_id exists for Hibernate validation.
-- This migration is idempotent to safely run on environments where the column already exists.

ALTER TABLE staff_profiles
    ADD COLUMN IF NOT EXISTS secondary_position_id BIGINT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_staff_profiles_secondary_position'
    ) THEN
        ALTER TABLE staff_profiles
            ADD CONSTRAINT fk_staff_profiles_secondary_position
            FOREIGN KEY (secondary_position_id)
            REFERENCES staff_positions(position_id);
    END IF;
END $$;

