-- Room_Blockings: khi tạo bản ghi thành công thì set room.status = BLOCKED (xử lý trong service)
CREATE TABLE IF NOT EXISTS room_blockings (
    id BIGSERIAL PRIMARY KEY,
    room_id BIGINT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    block_reason TEXT,
    blocked_from TIMESTAMP NOT NULL,
    blocked_to TIMESTAMP NOT NULL,
    blocked_by VARCHAR(255),
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_room_blockings_room_id ON room_blockings(room_id);
CREATE INDEX IF NOT EXISTS idx_room_blockings_blocked_from_to ON room_blockings(blocked_from, blocked_to);
