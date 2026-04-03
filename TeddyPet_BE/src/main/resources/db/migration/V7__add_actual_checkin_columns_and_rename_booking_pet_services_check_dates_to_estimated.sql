-- === Merged from: V7__add_actual_checkin_columns.sql ===
-- V7: Add actual_check_in_date & actual_check_out_date to booking_pet_services
-- DÃ¹ng cho ngÃ y nháº­n / tráº£ thá»±c táº¿. An toÃ n khi cháº¡y nhiá»u láº§n.

ALTER TABLE IF EXISTS booking_pet_services
    ADD COLUMN IF NOT EXISTS actual_check_in_date date;

ALTER TABLE IF EXISTS booking_pet_services
    ADD COLUMN IF NOT EXISTS actual_check_out_date date;



-- === Merged from: V7__rename_booking_pet_services_check_dates_to_estimated.sql ===
-- V17: Rename check_in_date / check_out_date to estimated_check_in_date / estimated_check_out_date
-- (NgÃ y nháº­n/tráº£ dá»± kiáº¿n do khÃ¡ch chá»n; actual_* do nhÃ¢n viÃªn set, Ä‘Ã£ cÃ³ á»Ÿ V7.)
-- Idempotent: only rename if old columns exist.

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'booking_pet_services' AND column_name = 'check_in_date'
    ) THEN
        ALTER TABLE booking_pet_services
            RENAME COLUMN check_in_date TO estimated_check_in_date;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'booking_pet_services' AND column_name = 'check_out_date'
    ) THEN
        ALTER TABLE booking_pet_services
            RENAME COLUMN check_out_date TO estimated_check_out_date;
    END IF;
END $$;



