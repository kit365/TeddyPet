-- Lưu thông tin từ webhook PayOS vào bảng payments để đối soát và tra cứu
-- PayOS gửi POST JSON tới /api/payment/payos/webhook khi khách thanh toán xong

ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS gateway_response_code VARCHAR(20),
    ADD COLUMN IF NOT EXISTS gateway_raw_payload TEXT;

COMMENT ON COLUMN payments.gateway_response_code IS 'Mã trả về từ PayOS (vd: 00=thành công, 07=đã hủy)';
COMMENT ON COLUMN payments.gateway_raw_payload IS 'JSON đầy đủ payload webhook PayOS đã verify, dùng để đối soát và debug';
