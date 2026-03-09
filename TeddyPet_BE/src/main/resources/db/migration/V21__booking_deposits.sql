-- Booking deposits: giữ phòng/slot tối đa 5 phút trước khi thanh toán

create table if not exists booking_deposits (
    id bigserial primary key,

    -- liên kết booking thật (có thể null vì tạo trước khi thanh toán/confirm)
    booking_id bigint null,
    booking_code varchar(50) null,

    -- ======= DEPOSIT AMOUNT =======
    deposit_amount decimal(10,2) not null default 0,
    deposit_percentage decimal(5,2) default 25.00,

    -- ======= DEPOSIT PAYMENT =======
    deposit_paid boolean default false,
    deposit_paid_at timestamp,
    payment_method varchar(50),

    -- ======= REFUND =======
    refunded boolean default false,
    refund_amount decimal(10,2) default 0,
    refund_percentage decimal(5,2) default 0,
    refunded_at timestamp,
    refund_method varchar(50),
    refund_reason text,

    -- ======= DUE DATE / REMINDER =======
    due_date timestamp,
    reminder_sent boolean default false,
    reminder_sent_at timestamp,

    -- ======= NOTES / STAFF =======
    notes text,
    status varchar(50) default 'PENDING',
    confirmed_by varchar(50),
    refund_processed_by varchar(50),

    -- ======= HOLD WINDOW =======
    expires_at timestamp not null,
    -- JSONB lưu draft booking + danh sách room/timeSlot đang giữ
    booking_draft jsonb,
    hold_payload jsonb not null default '{}'::jsonb,

    -- audit
    is_deleted boolean not null default false,
    is_active boolean not null default true,
    created_at timestamp(6) not null default now(),
    updated_at timestamp(6) not null default now(),
    created_by varchar(255),
    updated_by varchar(255)
);

create index if not exists idx_booking_deposits_booking_id on booking_deposits (booking_id);
create index if not exists idx_booking_deposits_status_expires on booking_deposits (status, expires_at);

