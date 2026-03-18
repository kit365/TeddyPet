-- Drop booking_start_date and booking_end_date columns from bookings table
ALTER TABLE bookings DROP COLUMN IF EXISTS booking_start_date;
ALTER TABLE bookings DROP COLUMN IF EXISTS booking_end_date;
