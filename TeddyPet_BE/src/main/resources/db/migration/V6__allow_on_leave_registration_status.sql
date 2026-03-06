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

