-- Ensure must_change_password column exists in users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT FALSE;
