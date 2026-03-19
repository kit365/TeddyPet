ALTER TABLE work_shift_registrations
    ADD COLUMN IF NOT EXISTS leave_reason TEXT;

