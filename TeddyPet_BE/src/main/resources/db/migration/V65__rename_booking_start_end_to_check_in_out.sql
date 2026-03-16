-- Rename booking_start_date / booking_end_date to booking_check_in_date / booking_check_out_date.
-- These are set by Check-in and Check-out actions on the booking detail screen.

DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='booking_start_date') THEN
        ALTER TABLE bookings RENAME COLUMN booking_start_date TO booking_check_in_date;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='booking_end_date') THEN
        ALTER TABLE bookings RENAME COLUMN booking_end_date TO booking_check_out_date;
    END IF;
END $$;
