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

