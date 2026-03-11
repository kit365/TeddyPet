-- Bank information (for refund / transfer details)

create table if not exists bank_information (
    id bigserial primary key,

    user_id uuid null,
    booking_id bigint null,

    account_number varchar(50) not null,
    account_holder_name varchar(255) not null,
    bank_code varchar(50) not null,
    bank_name varchar(255) not null,

    is_verify boolean not null default false,
    is_default boolean not null default false,

    note text,

    -- audit
    is_deleted boolean not null default false,
    is_active boolean not null default true,
    created_at timestamp(6) not null default now(),
    updated_at timestamp(6) not null default now(),
    created_by varchar(255),
    updated_by varchar(255)
);

create index if not exists idx_bank_information_user_id on bank_information (user_id);
create index if not exists idx_bank_information_booking_id on bank_information (booking_id);
create index if not exists idx_bank_information_bank_code on bank_information (bank_code);

-- Ensure only one default bank per user (soft-delete aware)
create unique index if not exists uq_bank_information_default_per_user
    on bank_information(user_id)
    where user_id is not null and is_default = true and is_deleted = false;

