ALTER TABLE booking_pets
ADD COLUMN pet_type VARCHAR(100),
ADD COLUMN status VARCHAR(50);

ALTER TABLE booking_pet_services
ADD COLUMN base_price NUMERIC(12,2);
