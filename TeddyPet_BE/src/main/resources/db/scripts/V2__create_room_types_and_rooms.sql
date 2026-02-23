-- Room types (loại phòng)
CREATE TABLE IF NOT EXISTS room_types (
    id BIGSERIAL PRIMARY KEY,
    service_id BIGINT REFERENCES services(id),
    type_name VARCHAR(255) NOT NULL,
    display_type_name VARCHAR(255),
    slug VARCHAR(255) UNIQUE,
    description TEXT,
    short_description VARCHAR(500),
    image_url VARCHAR(255),
    base_price_per_night DECIMAL(12,2),
    display_order INTEGER DEFAULT 0,
    total_rooms INTEGER,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Rooms (phòng)
CREATE TABLE IF NOT EXISTS rooms (
    id BIGSERIAL PRIMARY KEY,
    room_type_id BIGINT NOT NULL REFERENCES room_types(id),
    room_number VARCHAR(50) NOT NULL,
    room_name VARCHAR(255),
    building VARCHAR(100),
    floor VARCHAR(50),
    status VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
    is_available_for_booking BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_room_types_service_id ON room_types(service_id);
CREATE INDEX IF NOT EXISTS idx_rooms_room_type_id ON rooms(room_type_id);
