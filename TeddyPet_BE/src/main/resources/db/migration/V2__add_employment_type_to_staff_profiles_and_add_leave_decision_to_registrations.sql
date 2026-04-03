-- === Merged from: V2__add_employment_type_to_staff_profiles.sql ===
-- Loáº¡i hÃ¬nh lÃ m viá»‡c: PART_TIME (bÃ¡n thá»i gian), FULL_TIME (toÃ n thá»i gian)
ALTER TABLE staff_profiles
    ADD COLUMN IF NOT EXISTS employment_type VARCHAR(20);

COMMENT ON COLUMN staff_profiles.employment_type IS 'Loáº¡i hÃ¬nh: PART_TIME, FULL_TIME';


-- === Merged from: V2__add_leave_decision_to_registrations.sql ===
-- LÆ°u quyáº¿t Ä‘á»‹nh admin cho xin nghá»‰ (chá»‰ Ã¡p dá»¥ng khi báº¥m "Duyá»‡t láº§n cuá»‘i").
-- APPROVED_LEAVE = admin chá»n duyá»‡t nghá»‰, REJECTED_LEAVE = admin chá»n tá»« chá»‘i nghá»‰.
ALTER TABLE work_shift_registrations
    ADD COLUMN IF NOT EXISTS leave_decision VARCHAR(20) NULL;

COMMENT ON COLUMN work_shift_registrations.leave_decision IS 'APPROVED_LEAVE | REJECTED_LEAVE; chá»‰ Ã¡p dá»¥ng khi status = PENDING_LEAVE vÃ  khi admin báº¥m Duyá»‡t láº§n cuá»‘i';


