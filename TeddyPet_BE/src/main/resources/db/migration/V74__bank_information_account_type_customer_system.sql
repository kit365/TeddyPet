-- Đổi giá trị account_type thành chỉ còn CUSTOMER và SYSTEM; cập nhật toàn bộ bản ghi hiện có.

-- 1. Cập nhật dữ liệu: USER, BOOKING_REFUND -> CUSTOMER; SYSTEM_RECEIVING -> SYSTEM
UPDATE bank_information
SET account_type = CASE
    WHEN account_type = 'SYSTEM_RECEIVING' THEN 'SYSTEM'
    WHEN account_type IN ('USER', 'BOOKING_REFUND') OR account_type IS NULL THEN 'CUSTOMER'
    ELSE account_type
END;

-- 2. Đảm bảo mọi bản ghi còn lại (nếu có giá trị lạ) đều là CUSTOMER hoặc SYSTEM
UPDATE bank_information
SET account_type = 'CUSTOMER'
WHERE account_type NOT IN ('CUSTOMER', 'SYSTEM');

-- 3. Đổi default của cột
ALTER TABLE bank_information
    ALTER COLUMN account_type SET DEFAULT 'CUSTOMER';

-- 4. Xóa unique index cũ (SYSTEM_RECEIVING)
DROP INDEX IF EXISTS uq_bank_information_system_receiving;

-- 5. Unique index mới: tối đa 1 bản ghi SYSTEM (tài khoản nhận tiền hệ thống)
CREATE UNIQUE INDEX IF NOT EXISTS uq_bank_information_system
    ON bank_information (account_type)
    WHERE account_type = 'SYSTEM' AND is_deleted = false;

COMMENT ON COLUMN bank_information.account_type IS 'CUSTOMER = ngân hàng khách/hoàn tiền, SYSTEM = tài khoản nhận tiền thanh toán online (PayOS)';
