package fpt.teddypet.infrastructure.persistence.postgres.data;

import fpt.teddypet.domain.entity.ProductCategory;
import fpt.teddypet.infrastructure.persistence.postgres.repository.products.ProductCategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;


@Slf4j
@Component
@Order(5)
@RequiredArgsConstructor
public class ProductCategoryDataInit implements CommandLineRunner {

    private final ProductCategoryRepository productCategoryRepository;

    // Constants to avoid string duplication
    private static final String ROOT_PRODUCT = "Sản phẩm";
    private static final String ALL_PRODUCTS = "Tất cả sản phẩm";
    private static final String FOOD = "Thức ăn";
    private static final String TOY = "Đồ chơi";
    private static final String ACCESSORY = "Phụ kiện";
    private static final String NAME_TAG = "Thẻ tên";
    private static final String COLLAR = "Vòng cổ";
    private static final String HYGIENE = "Vệ sinh";
    private static final String HYGIENE_PRODUCTS = "Sản phẩm vệ sinh";
    
    private static final String CATEGORY_FOR_DOG = "Dành cho chó";
    private static final String CATEGORY_FOR_CAT = "Dành cho mèo";
    private static final String DESC_FOR_PETS = "cho thú cưng";
    private static final String DESC_FOR_DOG = "dành cho chó";
    private static final String DESC_FOR_CAT = "dành cho mèo";
    private static final String HYGIENE_FOR_DOG = HYGIENE_PRODUCTS + " cho chó";
    private static final String HYGIENE_FOR_CAT = HYGIENE_PRODUCTS + " cho mèo";

    @Override
    public void run(String... args) {
        initializeCategories();
    }

    private void initializeCategories() {
        // Root category: Sản phẩm
        ProductCategory rootProduct = createCategoryIfNotExists(ROOT_PRODUCT, 
                ALL_PRODUCTS + " " + DESC_FOR_PETS, null, null);

        // Thức ăn (child of Sản phẩm)
        ProductCategory foodCategory = createCategoryIfNotExists(FOOD, 
                FOOD + " " + DESC_FOR_PETS, rootProduct, null);

        // Dành cho chó (child of Thức ăn)
        createCategoryIfNotExists(CATEGORY_FOR_DOG, 
                FOOD + " " + DESC_FOR_DOG, foodCategory, null);

        // Dành cho mèo (child of Thức ăn)
        createCategoryIfNotExists(CATEGORY_FOR_CAT, 
                FOOD + " " + DESC_FOR_CAT, foodCategory, null);

        // Đồ chơi (child of Sản phẩm)
        ProductCategory toyCategory = createCategoryIfNotExists(TOY, 
                TOY + " " + DESC_FOR_PETS, rootProduct, null);

        // Dành cho chó (child of Đồ chơi)
        createCategoryIfNotExists(CATEGORY_FOR_DOG, 
                TOY + " " + DESC_FOR_DOG, toyCategory, null);

        // Dành cho mèo (child of Đồ chơi)
        createCategoryIfNotExists(CATEGORY_FOR_CAT, 
                TOY + " " + DESC_FOR_CAT, toyCategory, null);

        // Phụ kiện (child of Sản phẩm)
        ProductCategory accessoryCategory = createCategoryIfNotExists(ACCESSORY, 
                ACCESSORY + " " + DESC_FOR_PETS, rootProduct, null);

        // Thẻ tên (child of Phụ kiện)
        createCategoryIfNotExists(NAME_TAG, 
                NAME_TAG + " " + DESC_FOR_PETS, accessoryCategory, null);

        // Vòng cổ (child of Phụ kiện)
        createCategoryIfNotExists(COLLAR, 
                COLLAR + " " + DESC_FOR_PETS, accessoryCategory, null);

        // Vệ sinh (child of Sản phẩm)
        ProductCategory hygieneCategory = createCategoryIfNotExists(HYGIENE, 
                HYGIENE_PRODUCTS + " " + DESC_FOR_PETS, rootProduct, null);

        // Dành cho chó (child of Vệ sinh)
        createCategoryIfNotExists(CATEGORY_FOR_DOG, 
                HYGIENE_FOR_DOG, hygieneCategory, null);

        // Dành cho mèo (child of Vệ sinh)
        createCategoryIfNotExists(CATEGORY_FOR_CAT, 
                HYGIENE_FOR_CAT, hygieneCategory, null);
    }

    private ProductCategory createCategoryIfNotExists(String name, String description, ProductCategory parent, String imageUrl) {
        if (!productCategoryRepository.existsByName(name)) {
            ProductCategory category = ProductCategory.builder()
                    .name(name)
                    .description(description != null ? description : "")
                    .parent(parent)
                    .imageUrl(imageUrl != null ? imageUrl : "")
                    .altImage(imageUrl != null ? "Hình ảnh " + name : "")
                    .isActive(true)
                    .isDeleted(false)
                    .build();
            productCategoryRepository.save(category);
            log.info("✅ Created ProductCategory: {} (parent: {})", name, parent != null ? parent.getName() : "ROOT");
            return category;
        } else {
            log.debug("ProductCategory {} already exists, skipping", name);
            return productCategoryRepository.findByName(name)
                    .orElseThrow(() -> new RuntimeException("ProductCategory " + name + " not found"));
        }
    }
}

