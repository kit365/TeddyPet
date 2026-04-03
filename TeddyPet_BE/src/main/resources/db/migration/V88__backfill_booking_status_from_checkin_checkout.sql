-- Backfill legacy bookings whose actual check-in/check-out timestamps were saved
-- before booking.status started being updated by the admin flow.

UPDATE bookings
SET status = 'COMPLETED'
WHERE booking_check_out_date IS NOT NULL
  AND COALESCE(UPPER(status), '') NOT IN ('CANCELLED', 'COMPLETED');

UPDATE bookings
SET status = 'IN_PROGRESS'
WHERE booking_check_in_date IS NOT NULL
  AND booking_check_out_date IS NULL
  AND COALESCE(UPPER(status), '') NOT IN ('CANCELLED', 'COMPLETED', 'IN_PROGRESS');
