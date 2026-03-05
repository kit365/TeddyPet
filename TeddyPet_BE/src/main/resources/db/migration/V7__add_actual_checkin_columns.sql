-- V7: Add actual_check_in_date & actual_check_out_date to booking_pet_services
-- Dùng cho ngày nhận / trả thực tế. An toàn khi chạy nhiều lần.

ALTER TABLE IF EXISTS booking_pet_services
    ADD COLUMN IF NOT EXISTS actual_check_in_date date;

ALTER TABLE IF EXISTS booking_pet_services
    ADD COLUMN IF NOT EXISTS actual_check_out_date date;

