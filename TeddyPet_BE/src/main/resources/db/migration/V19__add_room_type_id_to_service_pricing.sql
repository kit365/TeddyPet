-- V19: Add room_type_id to service_pricing (quy tắc giá theo loại phòng, cho dịch vụ isRequiredRoom=true)
-- Idempotent: only add if column does not exist.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'service_pricing' AND column_name = 'room_type_id'
    ) THEN
        ALTER TABLE service_pricing ADD COLUMN room_type_id BIGINT NULL REFERENCES room_types(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_service_pricing_room_type_id ON service_pricing(room_type_id);
    END IF;
END $$;
