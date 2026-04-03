-- === Merged from: V3__add_contract_type_to_contracts.sql ===
-- Loáº¡i há»£p Ä‘á»“ng: FULL_TIME (toÃ n thá»i gian), PART_TIME (bÃ¡n thá»i gian)
ALTER TABLE contracts
    ADD COLUMN IF NOT EXISTS contract_type VARCHAR(20) DEFAULT 'FULL_TIME';

COMMENT ON COLUMN contracts.contract_type IS 'Loáº¡i há»£p Ä‘á»“ng: FULL_TIME, PART_TIME';


-- === Merged from: V3__add_pending_leave_registration_status.sql ===
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


