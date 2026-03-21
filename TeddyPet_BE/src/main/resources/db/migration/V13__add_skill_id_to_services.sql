-- Thêm cột skill_id vào bảng services
ALTER TABLE services ADD COLUMN IF NOT EXISTS skill_id BIGINT;

-- Tạo khóa ngoại
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_services_skills'
    ) THEN
        ALTER TABLE services ADD CONSTRAINT fk_services_skills FOREIGN KEY (skill_id) REFERENCES skills(skill_id);
    END IF;
END $$;
