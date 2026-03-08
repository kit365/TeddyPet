-- V16: Backfill product_categories.category_type and suitable_pet_types for existing rows
-- Ensure admin list can display categoryType & suitablePetTypes.

ALTER TABLE product_categories
    ADD COLUMN IF NOT EXISTS suitable_pet_types TEXT;

ALTER TABLE product_categories
    ADD COLUMN IF NOT EXISTS category_type VARCHAR(50);

-- 1) Backfill category_type for known Vietnamese names (idempotent)
UPDATE product_categories SET category_type = 'FOOD'
WHERE name = 'Thức ăn' AND (category_type IS NULL OR category_type = '');

UPDATE product_categories SET category_type = 'ACCESSORY'
WHERE name IN ('Phụ kiện', 'Thẻ tên', 'Vòng cổ') AND (category_type IS NULL OR category_type = '');

UPDATE product_categories SET category_type = 'TOY'
WHERE name = 'Đồ chơi' AND (category_type IS NULL OR category_type = '');

UPDATE product_categories SET category_type = 'HYGIENE'
WHERE name = 'Vệ sinh' AND (category_type IS NULL OR category_type = '');

UPDATE product_categories SET category_type = 'OTHER'
WHERE name = 'Sản phẩm' AND (category_type IS NULL OR category_type = '');

-- 2) Inherit category_type for children from parent when missing
UPDATE product_categories c
SET category_type = p.category_type
FROM product_categories p
WHERE c.parent_id = p.id
  AND (c.category_type IS NULL OR c.category_type = '')
  AND p.category_type IS NOT NULL
  AND p.category_type <> '';

-- 3) suitable_pet_types by name (idempotent)
UPDATE product_categories SET suitable_pet_types = '["DOG"]'
WHERE name = 'Dành cho chó' AND (suitable_pet_types IS NULL OR suitable_pet_types = '');

UPDATE product_categories SET suitable_pet_types = '["CAT"]'
WHERE name = 'Dành cho mèo' AND (suitable_pet_types IS NULL OR suitable_pet_types = '');

-- Parent categories: suitable for both DOG and CAT
UPDATE product_categories SET suitable_pet_types = '["DOG","CAT"]'
WHERE name IN ('Thức ăn', 'Đồ chơi', 'Phụ kiện', 'Vệ sinh')
  AND (suitable_pet_types IS NULL OR suitable_pet_types = '');

-- Root: all pet types
UPDATE product_categories SET suitable_pet_types = '["DOG","CAT","OTHER"]'
WHERE name = 'Sản phẩm' AND (suitable_pet_types IS NULL OR suitable_pet_types = '');

-- Accessory subcategories: common for all
UPDATE product_categories SET suitable_pet_types = '["DOG","CAT","OTHER"]'
WHERE name IN ('Thẻ tên', 'Vòng cổ') AND (suitable_pet_types IS NULL OR suitable_pet_types = '');

-- 4) Fallback: if still missing suitable_pet_types, derive from category_type
UPDATE product_categories
SET suitable_pet_types = '["DOG","CAT"]'
WHERE (suitable_pet_types IS NULL OR suitable_pet_types = '')
  AND category_type IN ('FOOD','TOY','HYGIENE','ACCESSORY');

UPDATE product_categories
SET suitable_pet_types = '["DOG","CAT","OTHER"]'
WHERE (suitable_pet_types IS NULL OR suitable_pet_types = '')
  AND (category_type IS NULL OR category_type = '' OR category_type = 'OTHER');

