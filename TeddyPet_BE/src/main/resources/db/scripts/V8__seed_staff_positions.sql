-- Chức vụ mặc định (chỉ insert nếu chưa có)
INSERT INTO staff_positions (code, name, description, is_deleted, is_active, created_at, updated_at)
SELECT 'CASHIER', 'Thu ngân', 'Nhân viên thu ngân, thanh toán', FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM staff_positions WHERE code = 'CASHIER');

INSERT INTO staff_positions (code, name, description, is_deleted, is_active, created_at, updated_at)
SELECT 'CARE_STAFF', 'Nhân viên chăm sóc', 'Nhân viên chăm sóc thú cưng (spa, cắt tỉa, tắm...)', FALSE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM staff_positions WHERE code = 'CARE_STAFF');
