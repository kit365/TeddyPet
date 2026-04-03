-- === Merged from: V12__add_audit_columns_to_booking_refunds.sql ===
-- Add missing audit columns to booking_refunds table (from BaseEntity)
ALTER TABLE booking_refunds
    ADD COLUMN IF NOT EXISTS created_by VARCHAR(255),
    ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255),
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE NOT NULL;


-- === Merged from: V12__remove_hire_date_from_staff_profiles.sql ===
-- XÃ³a cá»™t ngÃ y vÃ o lÃ m (hire_date) khá»i há»“ sÆ¡ nhÃ¢n viÃªn; thÃ´ng tin Ä‘Ã£ cÃ³ á»Ÿ há»£p Ä‘á»“ng.
-- Chá»‰ cháº¡y khi cá»™t hire_date cÃ²n tá»“n táº¡i (trÃ¡nh lá»—i khi DB Ä‘Ã£ Ã¡p dá»¥ng báº£n migration cÅ©).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'staff_profiles' AND column_name = 'hire_date'
  ) THEN
    -- BÆ°á»›c 1: Sao lÆ°u dá»¯ liá»‡u cÅ© vÃ o báº£ng backup (Ä‘á»ƒ rollback náº¿u cáº§n).
    CREATE TABLE IF NOT EXISTS staff_profiles_hire_date_backup (
      staff_id BIGINT NOT NULL PRIMARY KEY,
      hire_date DATE,
      backed_up_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP
    );
    COMMENT ON TABLE staff_profiles_hire_date_backup IS 'Backup hire_date trÆ°á»›c khi xÃ³a cá»™t; dÃ¹ng cho ROLLBACK_V9_restore_hire_date.sql';

    INSERT INTO staff_profiles_hire_date_backup (staff_id, hire_date)
    SELECT staff_id, hire_date FROM staff_profiles
    ON CONFLICT (staff_id) DO NOTHING;

    -- BÆ°á»›c 2: XÃ³a cá»™t khá»i staff_profiles.
    ALTER TABLE staff_profiles DROP COLUMN hire_date;
  END IF;
END $$;


