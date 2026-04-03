-- === Merged from: V4__create_pet_food_brought_table.sql ===
-- Create table to store detailed food items brought by the owner per booking pet
CREATE TABLE IF NOT EXISTS pet_food_brought (
    id                   BIGSERIAL PRIMARY KEY,
    booking_pet_id       BIGINT       NOT NULL,
    food_brought_type    VARCHAR(50),
    food_brand           VARCHAR(255),
    quantity             INTEGER,
    feeding_instructions TEXT,
    is_deleted           BOOLEAN      NOT NULL DEFAULT FALSE,
    is_active            BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by           VARCHAR(255),
    updated_by           VARCHAR(255)
);

ALTER TABLE pet_food_brought
    DROP CONSTRAINT IF EXISTS fk_pet_food_brought_booking_pet_id;

ALTER TABLE pet_food_brought
    ADD CONSTRAINT fk_pet_food_brought_booking_pet_id
        FOREIGN KEY (booking_pet_id) REFERENCES booking_pets (id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_pet_food_brought_booking_pet_id ON pet_food_brought (booking_pet_id);

-- Remove food-related detail fields from booking_pets now that they live in pet_food_brought
ALTER TABLE booking_pets
    DROP COLUMN IF EXISTS food_brought_type,
    DROP COLUMN IF EXISTS feeding_instructions,
    DROP COLUMN IF EXISTS food_brand;



-- === Merged from: V4__remove_hire_date_from_staff_profiles.sql ===
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


