-- Add is_required_room to services table (for room-type linking). Run once.
ALTER TABLE services ADD COLUMN is_required_room BOOLEAN NOT NULL DEFAULT false;
