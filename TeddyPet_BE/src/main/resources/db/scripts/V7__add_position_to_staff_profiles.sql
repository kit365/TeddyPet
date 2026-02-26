-- Thêm chức vụ vào hồ sơ nhân viên
ALTER TABLE staff_profiles
    ADD COLUMN IF NOT EXISTS position_id BIGINT;

ALTER TABLE staff_profiles
    ADD CONSTRAINT fk_staff_profiles_position
        FOREIGN KEY (position_id) REFERENCES staff_positions (position_id);

CREATE INDEX IF NOT EXISTS idx_staff_profiles_position_id ON staff_profiles (position_id);

COMMENT ON COLUMN staff_profiles.position_id IS 'Chức vụ (Thu ngân, Nhân viên chăm sóc, ...)';
