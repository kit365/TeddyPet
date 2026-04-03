-- V35: Ensure booking_deposits table exists for dev environments
-- This migration is idempotent and safe even if the table already exists.

CREATE TABLE IF NOT EXISTS booking_deposits (
    id                BIGSERIAL PRIMARY KEY,

    -- Link to real booking (may be null because deposit can be created before final booking)
    booking_id        BIGINT NULL,
    booking_code      VARCHAR(50) NULL,

    -- ======= DEPOSIT AMOUNT =======
    deposit_amount     DECIMAL(10, 2) NOT NULL DEFAULT 0,
    deposit_percentage DECIMAL(5, 2)  DEFAULT 25.00,

    -- ======= DEPOSIT PAYMENT =======
    deposit_paid    BOOLEAN      DEFAULT FALSE,
    deposit_paid_at TIMESTAMP,
    payment_method  VARCHAR(50),

    -- ======= REFUND =======
    refunded          BOOLEAN       DEFAULT FALSE,
    refund_amount     DECIMAL(10,2) DEFAULT 0,
    refund_percentage DECIMAL(5,2)  DEFAULT 0,
    refunded_at       TIMESTAMP,
    refund_method     VARCHAR(50),
    refund_reason     TEXT,

    -- ======= DUE DATE / REMINDER =======
    due_date         TIMESTAMP,
    reminder_sent    BOOLEAN        NOT NULL DEFAULT FALSE,
    reminder_sent_at TIMESTAMP,

    -- ======= NOTES / STAFF =======
    notes                TEXT,
    status               VARCHAR(50) DEFAULT 'PENDING',
    confirmed_by         VARCHAR(50),
    refund_processed_by  VARCHAR(50),

    -- ======= HOLD WINDOW & PAYLOADS =======
    expires_at      TIMESTAMP NOT NULL,
    hold_payload    TEXT,           -- final type after migrations
    webhook_payload TEXT,           -- added by V29 in main line

    -- ======= AUDIT =======
    is_deleted  BOOLEAN       NOT NULL DEFAULT FALSE,
    is_active   BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP(6)  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP(6)  NOT NULL DEFAULT NOW(),
    created_by  VARCHAR(255),
    updated_by  VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_booking_deposits_booking_id
    ON booking_deposits (booking_id);

CREATE INDEX IF NOT EXISTS idx_booking_deposits_status_expires
    ON booking_deposits (status, expires_at);

