-- Created: 2026-03-21 | booking refund admin evidence: support long data URLs (base64)
-- Fixes: value too long for type character varying(255)

ALTER TABLE booking_refund_admin_evidence
    ALTER COLUMN evidence_url TYPE TEXT;
