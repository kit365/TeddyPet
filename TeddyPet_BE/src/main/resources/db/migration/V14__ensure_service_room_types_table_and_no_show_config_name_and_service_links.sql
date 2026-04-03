-- === Merged from: V14__ensure_service_room_types_table.sql ===
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


-- === Merged from: V14__no_show_config_name_and_service_links.sql ===
-- TÃªn hiá»ƒn thá»‹ cho tá»«ng cáº¥u hÃ¬nh No-Show (quáº£n lÃ½ nhiá»u báº£n ghi)
ALTER TABLE no_show_config
    ADD COLUMN IF NOT EXISTS name VARCHAR(255) NOT NULL DEFAULT 'Cáº¥u hÃ¬nh No-Show';

-- Báº£ng ná»‘i: cáº¥u hÃ¬nh No-Show nÃ o Ã¡p dá»¥ng cho dá»‹ch vá»¥ nÃ o
CREATE TABLE IF NOT EXISTS no_show_config_services
(
    no_show_config_id BIGINT NOT NULL REFERENCES no_show_config (id) ON DELETE CASCADE,
    service_id        BIGINT NOT NULL REFERENCES services (id) ON DELETE CASCADE,
    CONSTRAINT pk_no_show_config_services PRIMARY KEY (no_show_config_id, service_id)
);

CREATE INDEX IF NOT EXISTS idx_nscs_service_id ON no_show_config_services (service_id);


