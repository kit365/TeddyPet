-- Add slug to service_combo. Run once.
ALTER TABLE service_combo ADD COLUMN slug VARCHAR(255) UNIQUE;
