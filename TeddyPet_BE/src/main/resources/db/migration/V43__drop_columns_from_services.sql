-- ===== DROP COLUMNS FROM SERVICES =====
ALTER TABLE services
    DROP COLUMN IF EXISTS cancellation_deadline_hours,
    DROP COLUMN IF EXISTS is_popular,
    DROP COLUMN IF EXISTS is_critical,
    DROP COLUMN IF EXISTS addon_type;
