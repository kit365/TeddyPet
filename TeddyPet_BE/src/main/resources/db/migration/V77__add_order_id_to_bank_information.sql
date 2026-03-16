-- Thêm order_id để lưu thông tin tài khoản người chuyển (từ PayOS webhook) theo đơn hàng.
ALTER TABLE bank_information
    ADD COLUMN IF NOT EXISTS order_id uuid NULL;

COMMENT ON COLUMN bank_information.order_id IS 'Đơn hàng liên quan (vd: lưu thông tin người chuyển từ PayOS theo order)';

CREATE INDEX IF NOT EXISTS idx_bank_information_order_id ON bank_information (order_id);
