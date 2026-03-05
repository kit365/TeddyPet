-- Add JSON column for food types brought and drop old brand column
ALTER TABLE booking_pets
    ADD COLUMN IF NOT EXISTS food_brought_type JSONB;

ALTER TABLE booking_pets
    DROP COLUMN IF EXISTS food_brand;

