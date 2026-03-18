-- Track cancellation at booking_pet_service and booking_pet_service_item level
-- and track overpaid credit to refund at booking level.

alter table booking_pet_services
    add column if not exists cancelled_reason text;

alter table booking_pet_services
    add column if not exists cancelled_by varchar(255);

alter table booking_pet_services
    add column if not exists cancelled_at timestamp(6);

alter table booking_pet_service_items
    add column if not exists cancelled_reason text;

alter table booking_pet_service_items
    add column if not exists cancelled_by varchar(255);

alter table booking_pet_service_items
    add column if not exists cancelled_at timestamp(6);

alter table bookings
    add column if not exists credit_to_refund numeric(12,2) not null default 0;

create index if not exists idx_booking_pet_services_cancelled_at on booking_pet_services (cancelled_at);
create index if not exists idx_booking_pet_service_items_cancelled_at on booking_pet_service_items (cancelled_at);
create index if not exists idx_bookings_credit_to_refund on bookings (credit_to_refund);

