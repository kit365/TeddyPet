-- Add customer_review_photos column to booking_pet_services table
-- This column stores comma-separated URLs of photos uploaded by customers during review.

ALTER TABLE booking_pet_services ADD COLUMN customer_review_photos TEXT;
