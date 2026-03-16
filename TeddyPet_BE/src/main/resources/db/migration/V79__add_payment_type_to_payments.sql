-- Thêm cột payment_type để phân biệt giao dịch thanh toán và hoàn tiền cho đơn hàng

ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS payment_type VARCHAR(50);

-- Gán mặc định ORDER_PAYMENT cho các bản ghi hiện tại (tất cả các payment hiện tại là thanh toán đơn hàng)
UPDATE payments
SET payment_type = 'ORDER_PAYMENT'
WHERE payment_type IS NULL;

-- Đảm bảo không null và giới hạn giá trị hợp lệ theo enum
ALTER TABLE payments
    ALTER COLUMN payment_type SET NOT NULL;

