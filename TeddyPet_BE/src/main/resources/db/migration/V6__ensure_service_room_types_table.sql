-- Ensure service_room_types exists (DB may have skipped booking V5 if it ran old staff V5–V10).
-- Safe to run when table already exists or when coming from develop without staff renumbering.
CREATE TABLE IF NOT EXISTS service_room_types (
    service_id BIGINT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    room_type_id BIGINT NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
    PRIMARY KEY (service_id, room_type_id),
    CONSTRAINT uq_service_room_type UNIQUE (service_id, room_type_id)
);

CREATE INDEX IF NOT EXISTS idx_service_room_types_service_id ON service_room_types(service_id);
CREATE INDEX IF NOT EXISTS idx_service_room_types_room_type_id ON service_room_types(room_type_id);

-- Migrate existing room_types.service_id into join table only if column still exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'room_types' AND column_name = 'service_id'
  ) THEN
    INSERT INTO service_room_types (service_id, room_type_id)
    SELECT service_id, id FROM room_types WHERE service_id IS NOT NULL
    ON CONFLICT (service_id, room_type_id) DO NOTHING;
    ALTER TABLE room_types DROP COLUMN service_id;
  END IF;
END $$;
