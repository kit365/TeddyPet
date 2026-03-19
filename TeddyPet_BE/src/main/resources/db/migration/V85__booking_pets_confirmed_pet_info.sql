-- Store staff-confirmed pet info at check-in time (for repricing/audit)

alter table booking_pets
    add column if not exists confirmed_pet_type varchar(100);

alter table booking_pets
    add column if not exists confirmed_weight numeric(6,2);

create index if not exists idx_booking_pets_confirmed_pet_type on booking_pets (confirmed_pet_type);

