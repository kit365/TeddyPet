-- V51: Add status column to booking_pet_services table
ALTER TABLE booking_pet_services
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'PENDING';
