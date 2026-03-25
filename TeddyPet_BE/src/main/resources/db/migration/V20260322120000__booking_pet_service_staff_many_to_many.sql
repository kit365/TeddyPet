-- N-N: booking_pet_service <-> staff_profiles; thay assigned_staff_id.

CREATE TABLE IF NOT EXISTS booking_pet_service_staff (
    booking_pet_service_id BIGINT NOT NULL REFERENCES booking_pet_services(id) ON DELETE CASCADE,
    staff_id BIGINT NOT NULL REFERENCES staff_profiles(staff_id) ON DELETE CASCADE,
    CONSTRAINT pk_booking_pet_service_staff PRIMARY KEY (booking_pet_service_id, staff_id)
);

CREATE INDEX IF NOT EXISTS idx_bps_staff_staff_id ON booking_pet_service_staff(staff_id);

INSERT INTO booking_pet_service_staff (booking_pet_service_id, staff_id)
SELECT id, assigned_staff_id
FROM booking_pet_services
WHERE assigned_staff_id IS NOT NULL
ON CONFLICT DO NOTHING;

ALTER TABLE booking_pet_services DROP COLUMN IF EXISTS assigned_staff_id;
