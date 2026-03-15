-- Thêm cột note cho giao dịch thanh toán (ghi nhận thu tiền từ màn hình lịch sử giao dịch)
ALTER TABLE booking_payment_transactions
    ADD COLUMN IF NOT EXISTS note TEXT;

COMMENT ON COLUMN booking_payment_transactions.note IS 'Ghi chú khi ghi nhận thu tiền (từ form admin)';
