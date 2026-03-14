-- Rename booking_start_date / booking_end_date to booking_check_in_date / booking_check_out_date.
-- These are set by Check-in and Check-out actions on the booking detail screen.

ALTER TABLE bookings RENAME COLUMN booking_start_date TO booking_check_in_date;
ALTER TABLE bookings RENAME COLUMN booking_end_date TO booking_check_out_date;
