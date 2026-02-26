-- Remove floor column from room_layout_config; no longer used
ALTER TABLE room_layout_config
    DROP COLUMN IF EXISTS floor;

