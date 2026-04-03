-- Remove legacy deposit column from bookings (moved to booking_deposits)
ALTER TABLE bookings
    DROP COLUMN IF EXISTS deposit;

