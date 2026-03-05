-- Bảng chức vụ nhân viên (Thu ngân, Nhân viên chăm sóc, ...)
CREATE TABLE IF NOT EXISTS staff_positions (
    position_id   BIGSERIAL PRIMARY KEY,
    code          VARCHAR(50)  NOT NULL,
    name          VARCHAR(150) NOT NULL,
    description   VARCHAR(500),
    is_deleted    BOOLEAN      NOT NULL DEFAULT FALSE,
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by    VARCHAR(255),
    updated_by    VARCHAR(255),
    CONSTRAINT uk_staff_positions_code UNIQUE (code)
);

CREATE INDEX idx_staff_positions_active_deleted ON staff_positions (is_active, is_deleted);

COMMENT ON TABLE staff_positions IS 'Danh mục chức vụ nhân viên (Thu ngân, Nhân viên chăm sóc, ...)';
