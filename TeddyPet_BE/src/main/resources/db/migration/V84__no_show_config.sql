-- NO_SHOW_CONFIG: Global configuration for customer no-show handling
-- Applies when a customer has a confirmed/paid booking but does not show up.

create table if not exists no_show_config (
    id bigserial primary key,

    -- Thời gian chờ khách sau giờ hẹn (phút). Nếu quá sẽ coi là NO-SHOW.
    grace_period_minutes int not null default 15,

    -- Tự động đánh dấu NO-SHOW sau khi quá grace_period hay staff phải bấm tay.
    auto_mark_no_show boolean not null default true,

    -- Có tịch thu cọc khi NO-SHOW không.
    forfeit_deposit boolean not null default true,

    -- Mức phạt bổ sung (VND) khi NO-SHOW, ngoài tiền cọc bị giữ (nếu có).
    penalty_amount numeric(12,2) not null default 0,

    -- Cho phép check-in muộn sau giờ hẹn nhưng vẫn coi là đến (không NO-SHOW).
    allow_late_checkin boolean not null default false,

    -- Số phút cho phép check-in muộn (chỉ áp dụng khi allow_late_checkin = true).
    late_checkin_minutes int not null default 30,

    -- audit fields
    is_deleted boolean not null default false,
    is_active boolean not null default true,
    created_at timestamp(6) not null default now(),
    updated_at timestamp(6) not null default now(),
    created_by varchar(255),
    updated_by varchar(255)
);

-- Ensure at most one active config (business logic will enforce single-row usage)
create index if not exists idx_no_show_config_active on no_show_config (is_active, is_deleted);

