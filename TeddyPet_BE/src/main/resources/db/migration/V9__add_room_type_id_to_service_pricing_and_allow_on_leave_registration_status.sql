-- === Merged from: V9__add_room_type_id_to_service_pricing.sql ===
-- V19: Add room_type_id to service_pricing (quy táº¯c giÃ¡ theo loáº¡i phÃ²ng, cho dá»‹ch vá»¥ isRequiredRoom=true)
-- Idempotent: only add if column does not exist.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'service_pricing' AND column_name = 'room_type_id'
    ) THEN
        ALTER TABLE service_pricing ADD COLUMN room_type_id BIGINT NULL REFERENCES room_types(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_service_pricing_room_type_id ON service_pricing(room_type_id);
    END IF;
END $$;


-- === Merged from: V9__allow_on_leave_registration_status.sql ===
-- Allow ON_LEAVE status for work_shift_registrations.status
-- Existing baseline constraint only allowed: PENDING, APPROVED, REJECTED

-- Drop existing CHECK constraint on status (name may differ between environments)
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
        CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'ON_LEAVE'));


