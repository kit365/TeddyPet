INSERT INTO roles (name, description, is_active, is_deleted, created_at, updated_at)
VALUES ('SUPER_ADMIN', 'Super Administrator with full system control', true, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (name) DO NOTHING;

-- Promote the default admin to SUPER_ADMIN
UPDATE users 
SET role_id = (SELECT id FROM roles WHERE name = 'SUPER_ADMIN') 
WHERE email = 'admin@gmail.com';
