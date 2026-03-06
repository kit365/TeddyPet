-- ROLLBACK: Khôi phục cột hire_date vào staff_profiles (chạy thủ công nếu cần hoàn tác V9).
-- Chạy file này khi cần rollback: psql ... -f scripts/ROLLBACK_V9_restore_hire_date.sql
-- Hoặc chạy từng lệnh trong công cụ SQL.

-- 1. Thêm lại cột (nullable để không lỗi với bản ghi chưa có backup).
ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS hire_date DATE;

-- 2. Khôi phục giá trị từ bảng backup.
UPDATE staff_profiles p
SET hire_date = b.hire_date
FROM staff_profiles_hire_date_backup b
WHERE p.staff_id = b.staff_id;

-- 3. Xóa bảng backup (tùy chọn; có thể giữ lại để tham chiếu).
DROP TABLE IF EXISTS staff_profiles_hire_date_backup;
