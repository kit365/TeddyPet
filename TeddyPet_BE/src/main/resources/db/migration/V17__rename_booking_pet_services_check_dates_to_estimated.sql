-- V17: Rename check_in_date / check_out_date to estimated_check_in_date / estimated_check_out_date
-- (Ngày nhận/trả dự kiến do khách chọn; actual_* do nhân viên set, đã có ở V7.)
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

