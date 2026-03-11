-- Refund policies for booking deposits (admin-configurable)

create table if not exists booking_deposit_refund_policies (
    id bigserial primary key,

    -- ======= BASIC INFO =======
    policy_name varchar(100) not null,
    description text,

    -- ======= DEPOSIT =======
    deposit_percentage decimal(5,2) not null default 25.00,

    -- ======= REFUND TIERS (hours before start) =======
    full_refund_hours int not null default 48,
    full_refund_percentage decimal(5,2) default 100.00,

    partial_refund_hours int not null default 24,
    partial_refund_percentage decimal(5,2) default 50.00,

    no_refund_hours int not null default 12,
    no_refund_percentage decimal(5,2) default 0.00,

    -- ======= NO-SHOW =======
    no_show_refund_percentage decimal(5,2) default 0.00,
    no_show_penalty decimal(10,2) default 0,

    -- ======= FORCE MAJEURE =======
    allow_force_majeure boolean default true,
    force_majeure_refund_percentage decimal(5,2) default 100.00,
    force_majeure_requires_evidence boolean default true,

    -- ======= STATUS / DISPLAY =======
    is_default boolean default false,
    display_order int default 0,
    highlight_text varchar(255),

    -- audit
    is_deleted boolean not null default false,
    is_active boolean not null default true,
    created_at timestamp(6) not null default now(),
    updated_at timestamp(6) not null default now(),
    created_by varchar(255),
    updated_by varchar(255)
);

create index if not exists idx_booking_deposit_refund_policies_active on booking_deposit_refund_policies (is_active, is_deleted);
create index if not exists idx_booking_deposit_refund_policies_default on booking_deposit_refund_policies (is_default);

-- Link booking deposits to a refund policy (nullable for legacy rows)
alter table booking_deposits
    add column if not exists refund_policy_id bigint null;

create index if not exists idx_booking_deposits_refund_policy_id on booking_deposits (refund_policy_id);

alter table booking_deposits
    add constraint fk_booking_deposits_refund_policy
        foreign key (refund_policy_id) references booking_deposit_refund_policies(id);

