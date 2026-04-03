-- Link avatar_images to user for "Chọn ảnh cũ" (list avatars per user)
ALTER TABLE avatar_images ADD COLUMN IF NOT EXISTS user_id UUID NULL;
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_avatar_images_user') THEN
        ALTER TABLE avatar_images ADD CONSTRAINT fk_avatar_images_user
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_avatar_images_user_id ON avatar_images(user_id);
