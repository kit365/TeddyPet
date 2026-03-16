-- Lưu email khách (guest) để lần sau dùng cùng email order/booking thì hiển thị lại thông tin chuyển khoản đã lưu
ALTER TABLE bank_information
    ADD COLUMN IF NOT EXISTS user_email VARCHAR(255) NULL;

CREATE INDEX IF NOT EXISTS idx_bank_information_user_email ON bank_information (user_email);
COMMENT ON COLUMN bank_information.user_email IS 'Email khách (guest) để tra cứu/thể hiện lại thông tin chuyển khoản khi dùng cùng email order hoặc booking';
