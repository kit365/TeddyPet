-- No-Show 1 — N Service: mỗi dịch vụ tối đa một cấu hình No-Show (FK trên bảng services).
ALTER TABLE services
    ADD COLUMN IF NOT EXISTS no_show_config_id BIGINT NULL
        REFERENCES no_show_config (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_services_no_show_config_id ON services (no_show_config_id);

-- Chuyển dữ liệu từ bảng trung gian (nếu đã có từ V14)
UPDATE services s
SET no_show_config_id = m.no_show_config_id
FROM no_show_config_services m
WHERE s.id = m.service_id
  AND (s.no_show_config_id IS DISTINCT FROM m.no_show_config_id);

DROP TABLE IF EXISTS no_show_config_services;
