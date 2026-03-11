-- Backfill cancellation_deadline_hours for existing services that have NULL value
UPDATE services SET cancellation_deadline_hours = 12 WHERE cancellation_deadline_hours IS NULL;
