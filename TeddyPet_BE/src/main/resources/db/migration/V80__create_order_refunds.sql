-- Order refunds: lưu yêu cầu hoàn tiền cho đơn hàng (customer request + admin process)

create table if not exists order_refunds (
    id bigserial primary key,

    order_id uuid not null references orders(id),
    payment_id uuid null references payments(id),
    bank_information_id bigint null references bank_information(id),

    requested_amount decimal(10,2) not null default 0,
    currency varchar(10) not null default 'VND',
    customer_reason text not null,
    evidence_urls text,

    status varchar(50) not null default 'PENDING', -- PENDING / APPROVED / REJECTED / CANCELLED
    admin_decision_note text,
    processed_by varchar(255),
    processed_at timestamp,

    refund_transaction_id varchar(100),
    refund_method varchar(50),
    refund_completed_at timestamp,

    -- audit
    is_deleted boolean not null default false,
    is_active boolean not null default true,
    created_at timestamp(6) not null default now(),
    updated_at timestamp(6) not null default now(),
    created_by varchar(255),
    updated_by varchar(255)
);

create index if not exists idx_order_refunds_order_id on order_refunds (order_id);
create index if not exists idx_order_refunds_status on order_refunds (status);

