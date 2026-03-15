-- Thêm loại tài khoản: USER (ngân hàng khách), BOOKING_REFUND (tk hoàn tiền đặt lịch), SYSTEM_RECEIVING (tài khoản nhận tiền thanh toán online PayOS)
ALTER TABLE bank_information
    ADD COLUMN IF NOT EXISTS account_type VARCHAR(50) NOT NULL DEFAULT 'USER';

-- Backfill: booking_id có giá trị -> BOOKING_REFUND, còn lại -> USER
UPDATE bank_information
SET account_type = CASE
    WHEN booking_id IS NOT NULL THEN 'BOOKING_REFUND'
    ELSE 'USER'
END
WHERE account_type = 'USER' OR account_type IS NULL;

CREATE INDEX IF NOT EXISTS idx_bank_information_account_type ON bank_information (account_type);

-- Chỉ cho phép tối đa 1 bản ghi SYSTEM_RECEIVING (tài khoản nhận tiền hệ thống)
CREATE UNIQUE INDEX IF NOT EXISTS uq_bank_information_system_receiving
    ON bank_information (account_type)
    WHERE account_type = 'SYSTEM_RECEIVING' AND is_deleted = false;
