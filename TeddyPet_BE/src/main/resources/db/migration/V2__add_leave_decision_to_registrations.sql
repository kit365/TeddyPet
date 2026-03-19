-- Lưu quyết định admin cho xin nghỉ (chỉ áp dụng khi bấm "Duyệt lần cuối").
-- APPROVED_LEAVE = admin chọn duyệt nghỉ, REJECTED_LEAVE = admin chọn từ chối nghỉ.
ALTER TABLE work_shift_registrations
    ADD COLUMN IF NOT EXISTS leave_decision VARCHAR(20) NULL;

COMMENT ON COLUMN work_shift_registrations.leave_decision IS 'APPROVED_LEAVE | REJECTED_LEAVE; chỉ áp dụng khi status = PENDING_LEAVE và khi admin bấm Duyệt lần cuối';
