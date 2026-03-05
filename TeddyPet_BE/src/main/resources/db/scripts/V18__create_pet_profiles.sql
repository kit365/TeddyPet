-- Pet profiles: hồ sơ thú cưng của user (One User - Many PetProfiles)
CREATE TABLE IF NOT EXISTS pet_profiles (
    id              BIGSERIAL PRIMARY KEY,
    user_id         UUID        NOT NULL,
    name            VARCHAR(100) NOT NULL,
    pet_type        VARCHAR(50)  NOT NULL,
    breed           VARCHAR(100),
    gender          VARCHAR(20),
    birth_date      DATE,
    weight          DECIMAL(5, 2),
    avatar_url      VARCHAR(500),
    alt_image       VARCHAR(255),
    is_neutered     BOOLEAN,
    health_note     TEXT,
    avatar_image_id BIGINT,
    is_deleted      BOOLEAN     NOT NULL DEFAULT FALSE,
    is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by      VARCHAR(255),
    updated_by      VARCHAR(255)
);

-- FK user_id: bảng users thường đã tồn tại (JPA/Hibernate hoặc migration khác)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        ALTER TABLE pet_profiles DROP CONSTRAINT IF EXISTS fk_pet_profiles_user_id;
        ALTER TABLE pet_profiles
            ADD CONSTRAINT fk_pet_profiles_user_id
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_pet_profiles_user_id ON pet_profiles (user_id);
COMMENT ON TABLE pet_profiles IS 'Hồ sơ thú cưng của người dùng; dùng trong booking_pets.pet_profile_id';
