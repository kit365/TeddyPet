-- Cleaning/maintenance tracking moved to Room_Cleaning_Tasks; notes in Room_Cleaning_Tasks
ALTER TABLE rooms DROP COLUMN IF EXISTS last_cleaned_at;
ALTER TABLE rooms DROP COLUMN IF EXISTS last_maintenance_at;
ALTER TABLE rooms DROP COLUMN IF EXISTS maintenance_notes;
