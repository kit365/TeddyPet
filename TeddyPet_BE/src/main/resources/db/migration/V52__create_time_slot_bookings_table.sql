-- Create time_slot_bookings table for services with isRequiredRoom = false
CREATE TABLE IF NOT EXISTS time_slot_bookings (
    id BIGSERIAL PRIMARY KEY,
    time_slot_id BIGINT NOT NULL,
    service_id BIGINT NOT NULL,
    booking_pet_service_id BIGINT NOT NULL UNIQUE,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    max_capacity INT,
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT DEFAULT 0,
    
    CONSTRAINT fk_tsb_time_slot FOREIGN KEY (time_slot_id) REFERENCES time_slots(id),
    CONSTRAINT fk_tsb_service FOREIGN KEY (service_id) REFERENCES services(id),
    CONSTRAINT fk_tsb_booking_pet_service FOREIGN KEY (booking_pet_service_id) REFERENCES booking_pet_services(id)
);

-- Create index for faster lookups
CREATE INDEX idx_time_slot_bookings_booking_date ON time_slot_bookings(booking_date);
CREATE INDEX idx_time_slot_bookings_time_slot_id ON time_slot_bookings(time_slot_id);
CREATE INDEX idx_time_slot_bookings_service_id ON time_slot_bookings(service_id);
CREATE INDEX idx_time_slot_bookings_booking_pet_service_id ON time_slot_bookings(booking_pet_service_id);
