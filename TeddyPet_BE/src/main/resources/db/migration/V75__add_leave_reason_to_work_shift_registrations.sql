-- Thêm cột lưu lý do xin nghỉ của nhân viên cho bảng work_shift_registrations

ALTER TABLE work_shift_registrations
    ADD COLUMN IF NOT EXISTS leave_reason text;

COMMENT ON COLUMN work_shift_registrations.leave_reason IS 'Lý do xin nghỉ do nhân viên nhập (nullable).';

