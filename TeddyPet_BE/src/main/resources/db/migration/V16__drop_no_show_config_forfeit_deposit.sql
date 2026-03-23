-- Tịch thu cọc khi no-show được xử lý bởi chính sách hoàn tiền đặt lịch; bỏ cột trùng nghĩa.
ALTER TABLE no_show_config
    DROP COLUMN IF EXISTS forfeit_deposit;
