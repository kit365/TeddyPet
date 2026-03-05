-- N-N: Service <-> RoomType (một dịch vụ có nhiều loại phòng, một loại phòng có thể dùng cho nhiều dịch vụ)
CREATE TABLE IF NOT EXISTS service_room_types (
    service_id BIGINT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    room_type_id BIGINT NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
    PRIMARY KEY (service_id, room_type_id),
    CONSTRAINT uq_service_room_type UNIQUE (service_id, room_type_id)
);

CREATE INDEX IF NOT EXISTS idx_service_room_types_service_id ON service_room_types(service_id);
CREATE INDEX IF NOT EXISTS idx_service_room_types_room_type_id ON service_room_types(room_type_id);

-- Migrate existing room_types.service_id into join table
INSERT INTO service_room_types (service_id, room_type_id)
SELECT service_id, id FROM room_types WHERE service_id IS NOT NULL
ON CONFLICT (service_id, room_type_id) DO NOTHING;

-- Drop FK and column from room_types (dropping column removes its FK)
ALTER TABLE room_types DROP COLUMN IF EXISTS service_id;
