-- Xóa cột ngày vào làm (hire_date) khỏi hồ sơ nhân viên; thông tin đã có ở hợp đồng.
-- Bước 1: Sao lưu dữ liệu cũ vào bảng backup (để rollback nếu cần).
CREATE TABLE IF NOT EXISTS staff_profiles_hire_date_backup (
    staff_id BIGINT NOT NULL PRIMARY KEY,
    hire_date DATE,
    backed_up_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE staff_profiles_hire_date_backup IS 'Backup hire_date trước khi xóa cột; dùng cho ROLLBACK_V9_restore_hire_date.sql';

INSERT INTO staff_profiles_hire_date_backup (staff_id, hire_date)
SELECT staff_id, hire_date FROM staff_profiles
ON CONFLICT (staff_id) DO NOTHING;

-- Bước 2: Xóa cột khỏi staff_profiles.
ALTER TABLE staff_profiles DROP COLUMN IF EXISTS hire_date;
