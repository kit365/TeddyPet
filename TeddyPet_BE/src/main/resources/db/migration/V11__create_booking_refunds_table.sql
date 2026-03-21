CREATE TABLE IF NOT EXISTS booking_refunds (
    id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT NOT NULL,
    bank_information_id BIGINT,
    requested_amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'VND' NOT NULL,
    customer_reason TEXT NOT NULL,
    evidence_urls TEXT,
    status VARCHAR(50) DEFAULT 'PENDING' NOT NULL,
    admin_decision_note TEXT,
    processed_by VARCHAR(255),
    processed_at TIMESTAMP,
    refund_transaction_id VARCHAR(100),
    refund_method VARCHAR(50),
    refund_completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    CONSTRAINT fk_booking_refunds_booking FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

CREATE TABLE IF NOT EXISTS booking_refund_admin_evidence (
    refund_id BIGINT NOT NULL,
    evidence_url VARCHAR(255) NOT NULL,
    CONSTRAINT fk_booking_refund_admin_evidence FOREIGN KEY (refund_id) REFERENCES booking_refunds(id) ON DELETE CASCADE
);
