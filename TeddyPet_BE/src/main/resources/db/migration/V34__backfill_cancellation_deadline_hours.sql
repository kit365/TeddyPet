-- Backfill cancellation_deadline_hours for existing services that have NULL value
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='services' AND column_name='cancellation_deadline_hours') THEN
        ALTER TABLE services ADD COLUMN cancellation_deadline_hours INTEGER;
    END IF;
END $$;

UPDATE services SET cancellation_deadline_hours = 12 WHERE cancellation_deadline_hours IS NULL;
