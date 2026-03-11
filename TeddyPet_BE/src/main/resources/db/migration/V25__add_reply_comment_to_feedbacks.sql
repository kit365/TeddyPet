-- V25: Add reply_comment and replied_at to feedbacks
ALTER TABLE feedbacks 
ADD COLUMN IF NOT EXISTS reply_comment TEXT,
ADD COLUMN IF NOT EXISTS replied_at TIMESTAMP;
