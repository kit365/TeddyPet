-- Amenity_Categories
CREATE TABLE IF NOT EXISTS amenity_categories (
    id BIGSERIAL PRIMARY KEY,
    category_name VARCHAR(255) NOT NULL,
    service_category_id BIGINT,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    icon VARCHAR(255),
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Amenities (categoryId -> amenity_categories.id)
CREATE TABLE IF NOT EXISTS amenities (
    id BIGSERIAL PRIMARY KEY,
    category_id BIGINT NOT NULL REFERENCES amenity_categories(id),
    service_category_id BIGINT,
    description VARCHAR(500),
    icon VARCHAR(255),
    image VARCHAR(255),
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_amenities_category_id ON amenities(category_id);
CREATE INDEX IF NOT EXISTS idx_amenity_categories_active ON amenity_categories(is_active, is_deleted);
CREATE INDEX IF NOT EXISTS idx_amenities_active ON amenities(is_active, is_deleted);
