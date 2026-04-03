-- Fix missing is_active column for time_slot_bookings table
ALTER TABLE time_slot_bookings
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- Update existing records to have is_active = true if they don't already
UPDATE time_slot_bookings
SET is_active = TRUE
WHERE is_active IS NULL;
