-- === Merged from: V11__add_leave_decision_to_registrations.sql ===
-- LÆ°u quyáº¿t Ä‘á»‹nh admin cho xin nghá»‰ (chá»‰ Ã¡p dá»¥ng khi báº¥m "Duyá»‡t láº§n cuá»‘i").
-- APPROVED_LEAVE = admin chá»n duyá»‡t nghá»‰, REJECTED_LEAVE = admin chá»n tá»« chá»‘i nghá»‰.
ALTER TABLE work_shift_registrations
    ADD COLUMN IF NOT EXISTS leave_decision VARCHAR(20) NULL;

COMMENT ON COLUMN work_shift_registrations.leave_decision IS 'APPROVED_LEAVE | REJECTED_LEAVE; chá»‰ Ã¡p dá»¥ng khi status = PENDING_LEAVE vÃ  khi admin báº¥m Duyá»‡t láº§n cuá»‘i';


-- === Merged from: V11__create_booking_refunds_table.sql ===
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


