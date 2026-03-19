-- Lưu URL ảnh mã QR VietQR của tài khoản nhận tiền (dùng cho SYSTEM_RECEIVING), để lần sau lấy lên dùng mà không cần tạo lại
ALTER TABLE bank_information
    ADD COLUMN IF NOT EXISTS vietqr_image_url TEXT;

COMMENT ON COLUMN bank_information.vietqr_image_url IS 'URL ảnh mã QR chuyển khoản VietQR (img.vietqr.io), dùng cho tài khoản nhận tiền hệ thống';
