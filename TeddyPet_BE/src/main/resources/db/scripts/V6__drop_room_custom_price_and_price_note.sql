-- Remove deprecated/relocated columns from rooms (blocking details -> Room_Blockings)
ALTER TABLE rooms DROP COLUMN IF EXISTS custom_price_per_night;
ALTER TABLE rooms DROP COLUMN IF EXISTS price_note;
ALTER TABLE rooms DROP COLUMN IF EXISTS expected_checkout_date;
ALTER TABLE rooms DROP COLUMN IF EXISTS current_check_in_date;
ALTER TABLE rooms DROP COLUMN IF EXISTS is_available_for_booking;
ALTER TABLE rooms DROP COLUMN IF EXISTS block_reason;
ALTER TABLE rooms DROP COLUMN IF EXISTS blocked_from;
ALTER TABLE rooms DROP COLUMN IF EXISTS blocked_to;
ALTER TABLE rooms DROP COLUMN IF EXISTS blocked_by;
