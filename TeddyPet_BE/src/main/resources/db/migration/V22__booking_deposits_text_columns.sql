-- Align booking_deposits JSON columns with JPA String mapping by using TEXT type.

alter table if exists booking_deposits
    alter column booking_draft type text using booking_draft::text;

alter table if exists booking_deposits
    alter column hold_payload type text using hold_payload::text;

