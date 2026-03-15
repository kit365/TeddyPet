-- Link avatar_images to user for "Chọn ảnh cũ" (list avatars per user)
ALTER TABLE avatar_images ADD COLUMN IF NOT EXISTS user_id UUID NULL;
ALTER TABLE avatar_images ADD CONSTRAINT fk_avatar_images_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_avatar_images_user_id ON avatar_images(user_id);
