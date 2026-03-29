-- Created: 2026-03-28 | staff password reissue audit + admin approval tokens
CREATE TABLE credential_reissue_history (
    id UUID PRIMARY KEY,
    subject_user_id UUID NOT NULL REFERENCES users (id),
    subject_role_name VARCHAR(50) NOT NULL,
    event_type VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL,
    admin_action_token_hash VARCHAR(128),
    expires_at TIMESTAMP(6),
    resolved_at TIMESTAMP(6),
    resolved_by_user_id UUID REFERENCES users (id),
    correlation_id UUID NOT NULL,
    metadata TEXT,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL
);

CREATE INDEX idx_credential_reissue_subject_status ON credential_reissue_history (subject_user_id, status);
CREATE INDEX idx_credential_reissue_token_hash ON credential_reissue_history (admin_action_token_hash);
