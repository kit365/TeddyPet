-- Trạng thái khóa chỉ thể hiện qua status = BLOCKED (set khi tạo Room_Blockings)
ALTER TABLE rooms DROP COLUMN IF EXISTS is_blocked;
