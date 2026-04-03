-- === Merged from: V17__create_booking_no_show_evaluations.sql ===
-- LÆ°u káº¿t quáº£ Ä‘Ã¡nh giÃ¡ no-show khi check-in (audit + tá»•ng pháº¡t Ä‘Ã£ cá»™ng vÃ o booking.total_amount)
CREATE TABLE IF NOT EXISTS booking_no_show_evaluations (
    id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT NOT NULL UNIQUE REFERENCES bookings (id) ON DELETE CASCADE,
    check_in_at TIMESTAMP NOT NULL,
    evaluated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total_penalty_applied NUMERIC(12, 2) NOT NULL DEFAULT 0,
    detail_json TEXT,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_booking_no_show_eval_booking_id ON booking_no_show_evaluations (booking_id);


-- === Merged from: V17__rename_booking_pet_services_check_dates_to_estimated.sql ===
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



