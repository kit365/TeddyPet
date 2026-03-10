alter table if exists bookings
    add column if not exists is_temporary boolean not null default false,
    add column if not exists cancelled_reason text;

alter table if exists users
    add column if not exists is_guest boolean not null default false,
    add column if not exists has_password boolean not null default true;

-- Đảm bảo dữ liệu hiện tại được gán giá trị hợp lý:
-- Tất cả user đã tồn tại ở thời điểm migrate đều là tài khoản thật (không phải guest booking tự sinh).
update users
set is_guest = false,
    has_password = true
where is_guest is distinct from false
   or has_password is distinct from true;

