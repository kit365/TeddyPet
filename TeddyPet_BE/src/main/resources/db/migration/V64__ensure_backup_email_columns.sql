-- Ensure backup_email exists (entities expect it; V54 may not have run)
ALTER TABLE users ADD COLUMN IF NOT EXISTS backup_email VARCHAR(255);
ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS backup_email VARCHAR(255);
