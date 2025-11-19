package fpt.teddypet.infrastructure.persistence.postgres.data;

import fpt.teddypet.application.util.SlugUtil;
import fpt.teddypet.domain.entity.Product;
import fpt.teddypet.domain.entity.ProductAgeRange;
import fpt.teddypet.domain.entity.ProductBrand;
import fpt.teddypet.domain.entity.ProductCategory;
import fpt.teddypet.domain.entity.ProductTag;
import fpt.teddypet.domain.entity.ProductVariant;
import fpt.teddypet.domain.enums.PetTypeEnum;
import fpt.teddypet.domain.enums.ProductStatusEnum;
import fpt.teddypet.domain.enums.UnitEnum;
import fpt.teddypet.domain.valueobject.Price;
import fpt.teddypet.domain.valueobject.Sku;
import fpt.teddypet.domain.valueobject.StockQuantity;
import fpt.teddypet.infrastructure.persistence.postgres.repository.ProductAgeRangeRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.ProductBrandRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.ProductCategoryRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.ProductRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.ProductTagRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.ProductVariantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Data initializer for Product entity
 */
@Slf4j
@Component
@Order(10) // Run after all related entities are initialized
@RequiredArgsConstructor
public class ProductDataInit implements CommandLineRunner {

    private final ProductRepository productRepository;
    private final ProductBrandRepository productBrandRepository;
    private final ProductCategoryRepository productCategoryRepository;
    private final ProductTagRepository productTagRepository;
    private final ProductAgeRangeRepository productAgeRangeRepository;
    private final ProductVariantRepository productVariantRepository;

    @Override
    public void run(String... args) {
        initializeProducts();
    }

    private void initializeProducts() {
        // Thức ăn cho chó
        createProductIfNotExists(
                "Thức ăn cho chó Royal Canin Adult",
                "Thức ăn khô cho chó trưởng thành, công thức dinh dưỡng cân bằng với protein chất lượng cao",
                "Thức ăn cho chó Royal Canin Adult - Dinh dưỡng cân bằng cho chó trưởng thành",
                "Thức ăn khô cho chó trưởng thành Royal Canin với công thức dinh dưỡng cân bằng, giàu protein chất lượng cao, hỗ trợ sức khỏe và phát triển toàn diện cho thú cưng của bạn.",
                new BigDecimal("250000"),
                new BigDecimal("350000"),
                "Pháp",
                "Ngũ cốc, thịt, rau củ",
                List.of(PetTypeEnum.DOG),
                ProductStatusEnum.IN_STOCK,
                getCategoryByName("Dành cho chó"), // Child of "Thức ăn"
                getBrandByName("Royal Canin"),
                filterNulls(getTagByEnumName("NEW"), getTagByEnumName("FEATURED")),
                filterNulls(getAgeRangeByEnumName("ADULT"))
        );

        // Thức ăn cho mèo
        createProductIfNotExists(
                "Thức ăn cho mèo Whiskas Tuna",
                "Thức ăn ướt cho mèo với cá ngừ, giàu protein và omega-3",
                "Thức ăn cho mèo Whiskas Tuna - Cá ngừ thơm ngon",
                "Thức ăn ướt cho mèo Whiskas với cá ngừ tự nhiên, giàu protein và omega-3, giúp mèo phát triển khỏe mạnh và có bộ lông mượt mà.",
                new BigDecimal("15000"),
                new BigDecimal("25000"),
                "Anh",
                "Cá ngừ, nước, chất phụ gia",
                List.of(PetTypeEnum.CAT),
                ProductStatusEnum.IN_STOCK,
                getCategoryByName("Dành cho mèo"), // Child of "Thức ăn"
                getBrandByName("Whiskas"),
                filterNulls(getTagByEnumName("NEW"), getTagByEnumName("BEST_SELLER")),
                filterNulls(getAgeRangeByEnumName("ADULT"), getAgeRangeByEnumName("ALL"))
        );

        // Đồ chơi cho chó
        createProductIfNotExists(
                "Bóng tennis cho chó",
                "Bóng tennis cao cấp dành cho chó, an toàn và bền",
                "Bóng tennis cho chó - Đồ chơi vận động",
                "Bóng tennis cao cấp được thiết kế đặc biệt cho chó, giúp thú cưng vận động và giải trí, an toàn với răng và nướu.",
                new BigDecimal("50000"),
                new BigDecimal("80000"),
                "Việt Nam",
                "Cao su, vải",
                List.of(PetTypeEnum.DOG),
                ProductStatusEnum.IN_STOCK,
                getCategoryByName("Đồ chơi"),
                null,
                filterNulls(getTagByEnumName("HOT"), getTagByEnumName("FEATURED")),
                filterNulls(getAgeRangeByEnumName("ALL"))
        );

        // Đồ chơi cho mèo
        createProductIfNotExists(
                "Cần câu cá cho mèo",
                "Cần câu cá đồ chơi cho mèo với lông vũ và chuông",
                "Cần câu cá cho mèo - Đồ chơi tương tác",
                "Cần câu cá đồ chơi cho mèo với lông vũ nhiều màu sắc và chuông, kích thích bản năng săn mồi tự nhiên của mèo.",
                new BigDecimal("60000"),
                new BigDecimal("90000"),
                "Trung Quốc",
                "Nhựa, lông vũ, kim loại",
                List.of(PetTypeEnum.CAT),
                ProductStatusEnum.IN_STOCK,
                getCategoryByName("Đồ chơi"),
                null,
                filterNulls(getTagByEnumName("HOT"), getTagByEnumName("NEW")),
                filterNulls(getAgeRangeByEnumName("ALL"))
        );

        // Phụ kiện
        createProductIfNotExists(
                "Vòng cổ da cho chó",
                "Vòng cổ da tự nhiên, bền và thoải mái cho chó",
                "Vòng cổ da cho chó - Phụ kiện thời trang",
                "Vòng cổ da tự nhiên cao cấp, thiết kế đẹp mắt và bền chắc, phù hợp cho mọi giống chó, có thể điều chỉnh kích thước.",
                new BigDecimal("120000"),
                new BigDecimal("180000"),
                "Việt Nam",
                "Da thuộc, kim loại",
                List.of(PetTypeEnum.DOG),
                ProductStatusEnum.IN_STOCK,
                getCategoryByName("Phụ kiện"),
                null,
                filterNulls(getTagByEnumName("FEATURED"), getTagByEnumName("SALE")),
                filterNulls(getAgeRangeByEnumName("ADULT"))
        );

        // Test stock cases - OUT_OF_STOCK (stock = 0)
        Product productOutOfStock = createProductIfNotExists(
                "Sản phẩm hết hàng - Test",
                "Sản phẩm test cho bộ lọc hết hàng",
                "Sản phẩm hết hàng - Test",
                "Sản phẩm test để kiểm tra bộ lọc hết hàng (OUT_OF_STOCK)",
                new BigDecimal("100000"),
                new BigDecimal("150000"),
                "Việt Nam",
                "Test",
                List.of(PetTypeEnum.DOG),
                ProductStatusEnum.OUT_OF_STOCK,
                getCategoryByName("Phụ kiện"),
                null,
                filterNulls(getTagByEnumName("SALE")),
                filterNulls(getAgeRangeByEnumName("ALL"))
        );
        
        // Add variant with stock = 0
        if (productOutOfStock != null) {
            ProductVariant variantOutOfStock = ProductVariant.builder()
                    .product(productOutOfStock)
                    .name("Variant hết hàng")
                    .price(Price.of(new BigDecimal("100000")))
                    .sku(Sku.of("TEST-OUT-STOCK-001"))
                    .stockQuantity(StockQuantity.of(0))
                    .unit(UnitEnum.PIECE)
                    .isActive(true)
                    .isDeleted(false)
                    .build();
            productOutOfStock.getVariants().add(variantOutOfStock);
            productRepository.save(productOutOfStock);
        }

        // Test stock cases - LOW_STOCK (stock < 10)
        Product productLowStock = createProductIfNotExists(
                "Sản phẩm tồn kho thấp - Test",
                "Sản phẩm test cho bộ lọc tồn kho thấp",
                "Sản phẩm tồn kho thấp - Test",
                "Sản phẩm test để kiểm tra bộ lọc tồn kho thấp (LOW_STOCK)",
                new BigDecimal("50000"),
                new BigDecimal("80000"),
                "Việt Nam",
                "Test",
                List.of(PetTypeEnum.CAT),
                ProductStatusEnum.IN_STOCK,
                getCategoryByName("Đồ chơi"),
                null,
                filterNulls(getTagByEnumName("HOT")),
                filterNulls(getAgeRangeByEnumName("ALL"))
        );
        
        // Add variant with stock = 5 (< 10)
        if (productLowStock != null) {
            ProductVariant variantLowStock = ProductVariant.builder()
                    .product(productLowStock)
                    .name("Variant tồn kho thấp")
                    .price(Price.of(new BigDecimal("50000")))
                    .sku(Sku.of("TEST-LOW-STOCK-001"))
                    .stockQuantity(StockQuantity.of(5))
                    .unit(UnitEnum.PIECE)
                    .isActive(true)
                    .isDeleted(false)
                    .build();
            productLowStock.getVariants().add(variantLowStock);
            productRepository.save(productLowStock);
        }
    }

    private Product createProductIfNotExists(
            String name,
            String description,
            String metaTitle,
            String metaDescription,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            String origin,
            String material,
            List<PetTypeEnum> petTypes,
            ProductStatusEnum status,
            ProductCategory category,
            ProductBrand brand,
            List<ProductTag> tags,
            List<ProductAgeRange> ageRanges) {
        
        String slug = SlugUtil.toSlug(name);
        if (!productRepository.existsBySlug(slug)) {
            Product product = Product.builder()
                    .slug(slug)
                    .name(name)
                    .description(description)
                    .metaTitle(metaTitle)
                    .metaDescription(metaDescription)
                    .minPrice(minPrice)
                    .maxPrice(maxPrice)
                    .origin(origin)
                    .material(material)
                    .petTypes(petTypes != null ? new ArrayList<>(petTypes) : new ArrayList<>())
                    .status(status)
                    .viewCount(0)
                    .soldCount(0)
                    .categories(category != null ? List.of(category) : new ArrayList<>())
                    .brand(brand)
                    .tags(tags != null && !tags.isEmpty() ? new ArrayList<>(tags) : new ArrayList<>())
                    .ageRanges(ageRanges != null && !ageRanges.isEmpty() ? new ArrayList<>(ageRanges) : new ArrayList<>())
                    .isActive(true)
                    .isDeleted(false)
                    .build();
            
            Product savedProduct = productRepository.save(product);
            
            // Create default variant for all products (except test products which have their own)
            if (!name.contains("Test")) {
                createDefaultVariant(savedProduct, minPrice);
            }
            
            log.info("✅ Created Product: {}", name);
            return savedProduct;
        } else {
            log.debug("Product {} already exists, skipping", name);
            Product existingProduct = productRepository.findBySlug(slug).orElse(null);
            // Ensure variant exists for existing products too
            if (existingProduct != null && !name.contains("Test")) {
                createDefaultVariant(existingProduct, minPrice);
            }
            return existingProduct;
        }
    }

    private ProductCategory getCategoryByName(String name) {
        return productCategoryRepository.findByName(name).orElse(null);
    }

    private ProductBrand getBrandByName(String name) {
        return productBrandRepository.findByName(name).orElse(null);
    }

    private ProductTag getTagByEnumName(String enumName) {
        return productTagRepository.findByName(enumName).orElse(null);
    }

    private ProductAgeRange getAgeRangeByEnumName(String enumName) {
        return productAgeRangeRepository.findByName(enumName).orElse(null);
    }

    private void createDefaultVariant(Product product, BigDecimal price) {
        if (product == null || price == null || product.getId() == null) {
            return;
        }
        
        // Check in DB if product already has variants (avoid lazy loading issues)
        List<ProductVariant> existingVariants = productVariantRepository.findByProductIdAndIsDeletedFalse(product.getId());
        if (existingVariants != null && !existingVariants.isEmpty()) {
            return;
        }
        
        try {
            String sku = "SKU-" + product.getSlug().toUpperCase().replace("-", "");
            // Check if SKU already exists
            if (productVariantRepository.existsBySkuValueAndIsDeletedFalse(sku)) {
                log.debug("SKU {} already exists, skipping variant creation for product {}", sku, product.getName());
                return;
            }
            
            ProductVariant variant = ProductVariant.builder()
                    .product(product)
                    .name("Default Variant")
                    .price(Price.of(price))
                    .sku(Sku.of(sku))
                    .stockQuantity(StockQuantity.of(100)) // Default stock = 100
                    .unit(UnitEnum.PIECE)
                    .isActive(true)
                    .isDeleted(false)
                    .build();
            
            product.getVariants().add(variant);
            productRepository.save(product);
            log.debug("✅ Created default variant for Product: {}", product.getName());
        } catch (Exception e) {
            log.warn("Failed to create default variant for product {}: {}", product.getName(), e.getMessage());
        }
    }

    @SafeVarargs
    private <T> List<T> filterNulls(T... items) {
        if (items == null) {
            return new ArrayList<>();
        }
        List<T> result = new ArrayList<>();
        for (T item : items) {
            if (item != null) {
                result.add(item);
            }
        }
        return result;
    }
}

