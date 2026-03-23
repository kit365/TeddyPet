-- Lưu kết quả đánh giá no-show khi check-in (audit + tổng phạt đã cộng vào booking.total_amount)
CREATE TABLE IF NOT EXISTS booking_no_show_evaluations (
    id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT NOT NULL UNIQUE REFERENCES bookings (id) ON DELETE CASCADE,
    check_in_at TIMESTAMP NOT NULL,
    evaluated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total_penalty_applied NUMERIC(12, 2) NOT NULL DEFAULT 0,
    detail_json TEXT,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_booking_no_show_eval_booking_id ON booking_no_show_evaluations (booking_id);
