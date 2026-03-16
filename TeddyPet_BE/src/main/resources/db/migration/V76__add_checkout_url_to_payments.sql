-- Lưu URL thanh toán từ PayOS để trả về khi user bấm "Thanh toán" lần 2 (PayOS báo đơn đã tồn tại)
ALTER TABLE payments ADD COLUMN IF NOT EXISTS checkout_url VARCHAR(512);
