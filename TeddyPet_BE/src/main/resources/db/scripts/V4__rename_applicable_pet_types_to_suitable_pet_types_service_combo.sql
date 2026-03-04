-- Rename applicable_pet_types to suitable_pet_types in service_combo. Run once.
ALTER TABLE service_combo RENAME COLUMN applicable_pet_types TO suitable_pet_types;
