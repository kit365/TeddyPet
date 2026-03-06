-- Allow PENDING_LEAVE status for work_shift_registrations.status (xin nghỉ chờ admin duyệt)

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
