-- === Merged from: V6__ensure_service_room_types_table.sql ===
-- Ensure service_room_types exists (DB may have skipped booking V5 if it ran old staff V5â€“V10).
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


-- === Merged from: V6__seed_room_layout_configs_for_required_services.sql ===
-- Initialized data: táº¡o 1 layout 10x10 cho má»—i dá»‹ch vá»¥ cÃ³ is_required_room = true mÃ  chÆ°a cÃ³ layout nÃ o.
INSERT INTO room_layout_config (layout_name, max_rows, max_cols, background_image, status, service_id, created_at, updated_at)
SELECT
    'Layout 10x10 - ' || COALESCE(s.service_name, 'Dá»‹ch vá»¥ #' || s.id),
    10,
    10,
    NULL,
    'NO_ROOMS_IS_SORTED',
    s.id,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM services s
WHERE s.is_required_room = true
  AND NOT EXISTS (
    SELECT 1 FROM room_layout_config rlc WHERE rlc.service_id = s.id
  );


