-- V15: Add suitable_pet_types (JSON) and category_type (enum-like) to product_categories

ALTER TABLE product_categories
    ADD COLUMN IF NOT EXISTS suitable_pet_types TEXT;

ALTER TABLE product_categories
    ADD COLUMN IF NOT EXISTS category_type VARCHAR(50);

-- Backfill category_type by name (Vietnamese labels from ProductCategoryDataInit)
UPDATE product_categories SET category_type = 'FOOD'    WHERE name = 'Thức ăn'     AND (category_type IS NULL OR category_type = '');
UPDATE product_categories SET category_type = 'ACCESSORY' WHERE name = 'Phụ kiện'   AND (category_type IS NULL OR category_type = '');
UPDATE product_categories SET category_type = 'TOY'     WHERE name = 'Đồ chơi'     AND (category_type IS NULL OR category_type = '');
UPDATE product_categories SET category_type = 'HYGIENE' WHERE name = 'Vệ sinh'     AND (category_type IS NULL OR category_type = '');
UPDATE product_categories SET category_type = 'OTHER'  WHERE name = 'Sản phẩm'    AND (category_type IS NULL OR category_type = '');
UPDATE product_categories SET category_type = 'ACCESSORY' WHERE name = 'Thẻ tên'   AND (category_type IS NULL OR category_type = '');
UPDATE product_categories SET category_type = 'ACCESSORY' WHERE name = 'Vòng cổ'   AND (category_type IS NULL OR category_type = '');

-- "Dành cho chó": suitable_pet_types = DOG only; category_type kế thừa từ parent (Thức ăn/Đồ chơi/Vệ sinh)
UPDATE product_categories c SET suitable_pet_types = '["DOG"]'
WHERE c.name = 'Dành cho chó' AND (c.suitable_pet_types IS NULL OR c.suitable_pet_types = '');

UPDATE product_categories c SET category_type = p.category_type
FROM product_categories p
WHERE c.parent_id = p.id AND c.name = 'Dành cho chó' AND (c.category_type IS NULL OR c.category_type = '');

-- "Dành cho mèo": suitable_pet_types = CAT only; category_type từ parent
UPDATE product_categories c SET suitable_pet_types = '["CAT"]'
WHERE c.name = 'Dành cho mèo' AND (c.suitable_pet_types IS NULL OR c.suitable_pet_types = '');

UPDATE product_categories c SET category_type = p.category_type
FROM product_categories p
WHERE c.parent_id = p.id AND c.name = 'Dành cho mèo' AND (c.category_type IS NULL OR c.category_type = '');

-- Parent categories (Thức ăn, Đồ chơi, Phụ kiện, Vệ sinh): suitable for both DOG and CAT
UPDATE product_categories SET suitable_pet_types = '["DOG","CAT"]'
WHERE name IN ('Thức ăn', 'Đồ chơi', 'Phụ kiện', 'Vệ sinh')
  AND (suitable_pet_types IS NULL OR suitable_pet_types = '');

-- Root "Sản phẩm": all pet types
UPDATE product_categories SET suitable_pet_types = '["DOG","CAT","OTHER"]'
WHERE name = 'Sản phẩm' AND (suitable_pet_types IS NULL OR suitable_pet_types = '');

-- Thẻ tên, Vòng cổ: common for all
UPDATE product_categories SET suitable_pet_types = '["DOG","CAT","OTHER"]'
WHERE name IN ('Thẻ tên', 'Vòng cổ') AND (suitable_pet_types IS NULL OR suitable_pet_types = '');
