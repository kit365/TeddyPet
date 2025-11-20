package fpt.teddypet.infrastructure.persistence.postgres.data;


import fpt.teddypet.application.util.SlugUtil;
import fpt.teddypet.domain.entity.*;
import fpt.teddypet.domain.enums.AttributeDisplayType;
import fpt.teddypet.domain.enums.PetTypeEnum;
import fpt.teddypet.domain.enums.ProductStatusEnum;
import fpt.teddypet.domain.enums.UnitEnum;
import fpt.teddypet.domain.valueobject.Price;
import fpt.teddypet.domain.valueobject.Sku;
import fpt.teddypet.domain.valueobject.StockQuantity;
import fpt.teddypet.infrastructure.persistence.postgres.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Slf4j
@Component
@Order(10)
@RequiredArgsConstructor
public class ProductData implements CommandLineRunner {

    private final ProductRepository productRepository;
    private final ProductBrandRepository productBrandRepository;
    private final ProductCategoryRepository productCategoryRepository;
    private final ProductTagRepository productTagRepository;
    private final ProductAgeRangeRepository productAgeRangeRepository;
    private final ProductVariantRepository productVariantRepository;
    private final ProductAttributeRepository productAttributeRepository;
    private final ProductAttributeValueRepository productAttributeValueRepository;

    @Override
    public void run(String... args) throws Exception {
        initializeProducts();
    }

    private void initializeProducts() {
        // Kiểm tra nếu đã có sản phẩm thì skip để tránh duplicate
        if (productRepository.count() > 0) {
            log.info("⏭️ Products already initialized, skipping...");
            return;
        }

        log.info("🚀 Starting products initialization...");

        // =================================================================================
        // 1. KHỞI TẠO MASTER DATA (ATTRIBUTES & VALUES)
        // =================================================================================

        // Attribute: Hương vị
        ProductAttribute flavorAttr = createAttribute("Hương vị", AttributeDisplayType.SELECT);
        ProductAttributeValue flavorChicken = createAttributeValue(flavorAttr, "Gà", 1, null);
        ProductAttributeValue flavorBeef = createAttributeValue(flavorAttr, "Bò", 2, null);
        ProductAttributeValue flavorTuna = createAttributeValue(flavorAttr, "Cá ngừ", 3, null);
        ProductAttributeValue flavorSalmon = createAttributeValue(flavorAttr, "Cá hồi", 4, null);

        // Attribute: Trọng lượng
        ProductAttribute weightAttr = createAttribute("Trọng lượng", AttributeDisplayType.RADIO);
        ProductAttributeValue weight100g = createAttributeValue(weightAttr, "100g", 1, null);
        ProductAttributeValue weight1kg = createAttributeValue(weightAttr, "1kg", 2, null);
        ProductAttributeValue weight2kg = createAttributeValue(weightAttr, "2kg", 3, null);
        ProductAttributeValue weight5kg = createAttributeValue(weightAttr, "5kg", 4, null);

        // Attribute: Màu sắc
        ProductAttribute colorAttr = createAttribute("Màu sắc", AttributeDisplayType.COLOR);
        ProductAttributeValue colorRed = createAttributeValue(colorAttr, "Đỏ", 1, "#FF0000");
        ProductAttributeValue colorBlue = createAttributeValue(colorAttr, "Xanh dương", 2, "#0000FF");
        ProductAttributeValue colorBlack = createAttributeValue(colorAttr, "Đen", 3, "#000000");
        ProductAttributeValue colorPink = createAttributeValue(colorAttr, "Hồng", 4, "#FFC0CB");

        // Attribute: Kích cỡ
        ProductAttribute sizeAttr = createAttribute("Kích cỡ", AttributeDisplayType.SELECT);
        ProductAttributeValue sizeS = createAttributeValue(sizeAttr, "S", 1, null);
        ProductAttributeValue sizeM = createAttributeValue(sizeAttr, "M", 2, null);
        ProductAttributeValue sizeL = createAttributeValue(sizeAttr, "L", 3, null);
        ProductAttributeValue sizeXL = createAttributeValue(sizeAttr, "XL", 4, null);

        // =================================================================================
        // 2. TẠO SẢN PHẨM VÀ GẮN BIẾN THỂ
        // =================================================================================

        // --- SẢN PHẨM 1: THỨC ĂN CHÓ (Nhiều biến thể theo Vị & Cân nặng) ---
        Product dogFood = createProduct(
                "Thức ăn cho chó Royal Canin Adult",
                "Thức ăn khô cho chó trưởng thành, công thức dinh dưỡng cân bằng",
                "Thức ăn cho chó Royal Canin Adult - Dinh dưỡng cân bằng cho chó trưởng thành",
                "Chi tiết về thức ăn cho chó...",
                new BigDecimal("250000"), // Min Price
                new BigDecimal("550000"), // Max Price
                "Pháp",
                "Ngũ cốc, thịt, rau củ",
                List.of(PetTypeEnum.DOG),
                getCategoryByName("Dành cho chó"),
                getBrandByName("Royal Canin"),
                List.of(getTagByName("NEW"), getTagByName("FEATURED")),
                List.of(getAgeRangeByName("ADULT"))
        );

        // Gắn Attribute vào Product cha (Quan hệ N-N)
        linkAttributesToProduct(dogFood, flavorAttr, weightAttr);

        // Tạo Variants (Tổ hợp Vị + Cân nặng)
        createVariant(dogFood, "Gà - 1kg", "RC-CHICKEN-1KG", new BigDecimal("250000"), 100, flavorChicken, weight1kg);
        createVariant(dogFood, "Gà - 2kg", "RC-CHICKEN-2KG", new BigDecimal("480000"), 50, flavorChicken, weight2kg);
        createVariant(dogFood, "Bò - 1kg", "RC-BEEF-1KG", new BigDecimal("270000"), 80, flavorBeef, weight1kg);
        createVariant(dogFood, "Bò - 5kg", "RC-BEEF-5KG", new BigDecimal("1200000"), 20, flavorBeef, weight5kg);


        // --- SẢN PHẨM 2: THỨC ĂN MÈO (Nhiều biến thể theo Vị & Cân nặng) ---
        Product catFood = createProduct(
                "Thức ăn cho mèo Whiskas Tuna",
                "Thức ăn ướt cho mèo với cá ngừ thơm ngon",
                "Thức ăn cho mèo Whiskas Tuna - Cá ngừ thơm ngon",
                "Chi tiết thức ăn mèo...",
                new BigDecimal("15000"),
                new BigDecimal("30000"),
                "Anh",
                "Cá ngừ, nước",
                List.of(PetTypeEnum.CAT),
                getCategoryByName("Dành cho mèo"),
                getBrandByName("Whiskas"),
                List.of(getTagByName("BEST_SELLER")),
                List.of(getAgeRangeByName("ALL"))
        );

        linkAttributesToProduct(catFood, flavorAttr, weightAttr);

        createVariant(catFood, "Cá ngừ - 100g", "WK-TUNA-100G", new BigDecimal("15000"), 200, flavorTuna, weight100g);
        createVariant(catFood, "Cá ngừ - 1kg", "WK-TUNA-1KG", new BigDecimal("140000"), 50, flavorTuna, weight1kg);
        createVariant(catFood, "Cá hồi - 100g", "WK-SALMON-100G", new BigDecimal("18000"), 150, flavorSalmon, weight100g);


        // --- SẢN PHẨM 3: VÒNG CỔ (Nhiều biến thể theo Màu & Size) ---
        Product collar = createProduct(
                "Vòng cổ da cao cấp",
                "Vòng cổ da thật, bền đẹp, nhiều màu sắc",
                "Vòng cổ da cao cấp cho thú cưng",
                "Vòng cổ làm từ da thật 100%...",
                new BigDecimal("90000"),
                new BigDecimal("150000"),
                "Việt Nam",
                "Da bò",
                List.of(PetTypeEnum.DOG, PetTypeEnum.CAT),
                getCategoryByName("Vòng cổ"),
                null, // Không brand
                List.of(getTagByName("HOT")),
                List.of(getAgeRangeByName("ALL"))
        );

        linkAttributesToProduct(collar, colorAttr, sizeAttr);

        createVariant(collar, "Đỏ - S", "COLLAR-RED-S", new BigDecimal("90000"), 50, colorRed, sizeS);
        createVariant(collar, "Đỏ - M", "COLLAR-RED-M", new BigDecimal("100000"), 50, colorRed, sizeM);
        createVariant(collar, "Xanh - S", "COLLAR-BLUE-S", new BigDecimal("90000"), 30, colorBlue, sizeS);
        createVariant(collar, "Xanh - L", "COLLAR-BLUE-L", new BigDecimal("120000"), 20, colorBlue, sizeL);
        createVariant(collar, "Đen - XL", "COLLAR-BLACK-XL", new BigDecimal("150000"), 10, colorBlack, sizeXL);
        createVariant(collar, "Pink - XL", "COLLAR-Pink-XL", new BigDecimal("150000"), 10, colorPink, sizeXL);


        // --- SẢN PHẨM 4: ĐỒ CHƠI (Không có biến thể - Default Variant) ---
        Product toy = createProduct(
                "Bóng tennis đồ chơi",
                "Bóng cao su đàn hồi tốt",
                "Bóng tennis đồ chơi cho chó",
                "Bóng siêu bền...",
                new BigDecimal("50000"),
                new BigDecimal("50000"),
                "Trung Quốc",
                "Cao su",
                List.of(PetTypeEnum.DOG),
                getCategoryByName("Đồ chơi"),
                null,
                List.of(getTagByName("SALE")),
                List.of(getAgeRangeByName("ALL"))
        );

        createDefaultVariant(toy, new BigDecimal("50000"));

        log.info("✅ Products initialization completed");
    }

    // =================================================================================
    // HELPER METHODS - CREATION LOGIC
    // =================================================================================

    private ProductAttribute createAttribute(String name, AttributeDisplayType type) {
        return productAttributeRepository.findByName(name)
                .orElseGet(() -> productAttributeRepository.save(
                        ProductAttribute.builder()
                                .name(name)
                                .displayType(type)
                                .displayOrder(0)
                                .build()
                ));
    }

    private ProductAttributeValue createAttributeValue(ProductAttribute attribute, String value, int order, String displayCode) {
        return productAttributeValueRepository.findByAttributeAndValue(attribute, value)
                .orElseGet(() -> productAttributeValueRepository.save(
                        ProductAttributeValue.builder()
                                .attribute(attribute)
                                .value(value)
                                .displayOrder(order)
                                .build()
                ));
    }

    private Product createProduct(
            String name, String description, String metaTitle, String metaDescription,
            BigDecimal minPrice, BigDecimal maxPrice, String origin, String material,
            List<PetTypeEnum> petTypes, ProductCategory category, ProductBrand brand,
            List<ProductTag> tags, List<ProductAgeRange> ageRanges) {

        String slug = SlugUtil.toSlug(name);
        if (productRepository.existsBySlug(slug)) {
            return productRepository.findBySlug(slug).orElseThrow();
        }

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
                .petTypes(new ArrayList<>(petTypes))
                .status(ProductStatusEnum.IN_STOCK)
                .viewCount(0)
                .soldCount(0)
                .categories(category != null ? new ArrayList<>(List.of(category)) : new ArrayList<>())
                .brand(brand)
                .tags(new ArrayList<>(tags))
                .ageRanges(new ArrayList<>(ageRanges))
                .isActive(true)
                .isDeleted(false)
                .attributes(new ArrayList<>())
                .variants(new ArrayList<>())
                .build();

        return productRepository.save(product);
    }

    private void linkAttributesToProduct(Product product, ProductAttribute... attributes) {
        product.getAttributes().clear();
        product.getAttributes().addAll(Arrays.asList(attributes));
        productRepository.save(product);
    }

    // Hàm tạo Variant gộp (Product + Attributes Values)
    private void createVariant(Product product, String name, String skuValue, BigDecimal price, int stock, ProductAttributeValue... values) {
        if (productVariantRepository.existsBySkuValueAndIsDeletedFalse(skuValue)) {
            return;
        }

        ProductVariant variant = ProductVariant.builder()
                .product(product)
                .name(name)
                .sku(Sku.of(skuValue))
                .price(Price.of(price))
                .stockQuantity(StockQuantity.of(stock))
                .unit(UnitEnum.PIECE)
                .attributeValues(new ArrayList<>(Arrays.asList(values))) // Gắn N-N Value
                .isActive(true)
                .isDeleted(false)
                .build();

        product.getVariants().add(variant);
        productVariantRepository.save(variant);
    }

    private void createDefaultVariant(Product product, BigDecimal price) {
        if (!product.getVariants().isEmpty()) return;
        String sku = "SKU-" + product.getSlug().toUpperCase().replace("-", "");

        ProductVariant variant = ProductVariant.builder()
                .product(product)
                .name("Default")
                .sku(Sku.of(sku))
                .price(Price.of(price))
                .stockQuantity(StockQuantity.of(100))
                .unit(UnitEnum.PIECE)
                .isActive(true)
                .isDeleted(false)
                .build();

        product.getVariants().add(variant);
        productVariantRepository.save(variant);
    }

    // --- Helpers lấy Master Data ---
    private ProductCategory getCategoryByName(String name) {
        return productCategoryRepository.findByName(name).orElse(null);
    }
    private ProductBrand getBrandByName(String name) {
        return productBrandRepository.findByName(name).orElse(null);
    }
    private ProductTag getTagByName(String name) {
        // Tìm theo tên enum hoặc tên hiển thị tùy logic bạn lưu
        return productTagRepository.findAll().stream()
                .filter(t -> t.getName().equalsIgnoreCase(name) || t.getName().contains(name))
                .findFirst().orElse(null);
    }
    private ProductAgeRange getAgeRangeByName(String name) {
        return productAgeRangeRepository.findAll().stream()
                .filter(a -> a.getName().equalsIgnoreCase(name) || a.getName().contains(name))
                .findFirst().orElse(null);
    }
}
