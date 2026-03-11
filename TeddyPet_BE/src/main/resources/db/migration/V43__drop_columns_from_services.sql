-- ===== DROP COLUMNS FROM SERVICES =====
ALTER TABLE services
    DROP COLUMN cancellation_deadline_hours,
    DROP COLUMN is_popular,
    DROP COLUMN is_critical,
    DROP COLUMN addon_type;
