-- Allow room_number to be null; it is set by other logic, not via create/update API
ALTER TABLE rooms ALTER COLUMN room_number DROP NOT NULL;
