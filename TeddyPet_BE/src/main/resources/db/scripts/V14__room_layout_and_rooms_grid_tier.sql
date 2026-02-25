-- Rename floor to tier in rooms
ALTER TABLE rooms RENAME COLUMN floor TO tier;

-- Add grid and sort fields to rooms
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS grid_row INTEGER;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS grid_col INTEGER;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS is_sorted BOOLEAN NOT NULL DEFAULT false;

-- Room_Layout_Config table (from ERD)
CREATE TABLE IF NOT EXISTS room_layout_config (
    id BIGSERIAL PRIMARY KEY,
    layout_name VARCHAR(255),
    block VARCHAR(100),
    max_rows INTEGER NOT NULL,
    max_cols INTEGER NOT NULL,
    floor VARCHAR(50),
    background_image VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Link rooms to layout (optional)
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS room_layout_config_id BIGINT REFERENCES room_layout_config(id);
CREATE INDEX IF NOT EXISTS idx_rooms_room_layout_config_id ON rooms(room_layout_config_id);

-- Chốt chặn 1: room_number UNIQUE (multiple NULLs allowed)
CREATE UNIQUE INDEX IF NOT EXISTS uk_rooms_room_number ON rooms(room_number) WHERE room_number IS NOT NULL;

-- Chốt chặn 2: unique physical position (block, floor from layout context: use room_layout_config_id + grid_row, grid_col, tier)
-- When a room is placed on a layout, (layout_id, grid_row, grid_col, tier) must be unique
CREATE UNIQUE INDEX IF NOT EXISTS uk_rooms_layout_grid_tier
ON rooms(room_layout_config_id, grid_row, grid_col, tier)
WHERE room_layout_config_id IS NOT NULL AND grid_row IS NOT NULL AND grid_col IS NOT NULL AND tier IS NOT NULL;
