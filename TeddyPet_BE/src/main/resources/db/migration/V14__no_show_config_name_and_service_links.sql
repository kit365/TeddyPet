-- Tên hiển thị cho từng cấu hình No-Show (quản lý nhiều bản ghi)
ALTER TABLE no_show_config
    ADD COLUMN IF NOT EXISTS name VARCHAR(255) NOT NULL DEFAULT 'Cấu hình No-Show';

-- Bảng nối: cấu hình No-Show nào áp dụng cho dịch vụ nào
CREATE TABLE IF NOT EXISTS no_show_config_services
(
    no_show_config_id BIGINT NOT NULL REFERENCES no_show_config (id) ON DELETE CASCADE,
    service_id        BIGINT NOT NULL REFERENCES services (id) ON DELETE CASCADE,
    CONSTRAINT pk_no_show_config_services PRIMARY KEY (no_show_config_id, service_id)
);

CREATE INDEX IF NOT EXISTS idx_nscs_service_id ON no_show_config_services (service_id);
