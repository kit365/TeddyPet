-- Loại hình làm việc: PART_TIME (bán thời gian), FULL_TIME (toàn thời gian)
ALTER TABLE staff_profiles
    ADD COLUMN IF NOT EXISTS employment_type VARCHAR(20);

COMMENT ON COLUMN staff_profiles.employment_type IS 'Loại hình: PART_TIME, FULL_TIME';
