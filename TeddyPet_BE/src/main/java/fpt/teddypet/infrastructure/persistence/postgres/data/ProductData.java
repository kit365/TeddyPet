package fpt.teddypet.infrastructure.persistence.postgres.data;

import fpt.teddypet.application.util.SlugUtil;
import fpt.teddypet.domain.entity.*;
import fpt.teddypet.domain.enums.AttributeDisplayType;
import fpt.teddypet.domain.enums.PetTypeEnum;
import fpt.teddypet.domain.enums.ProductStatusEnum;
import fpt.teddypet.domain.enums.UnitEnum;
import fpt.teddypet.domain.valueobject.Measurement;
import fpt.teddypet.domain.valueobject.Price;
import fpt.teddypet.domain.valueobject.Sku;
import fpt.teddypet.domain.valueobject.StockQuantity;
import fpt.teddypet.infrastructure.persistence.postgres.repository.products.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * Data initializer for Product entity
 * Chứa logic tạo mẫu cho cả Định lượng (Measurement) và Định tính (Visual)
 */
@Slf4j
@Component
@Order(10) // Chạy sau các bảng Master
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
    @Transactional
    public void run(String... args) {
        initializeProducts();
    }

    private void initializeProducts() {
        if (productRepository.count() > 0) {
            log.info("⏭️ Products already initialized, skipping...");
            return;
        }

        log.info("🚀 Starting products initialization...");

        // =================================================================================
        // 1. KHỞI TẠO MASTER DATA (ATTRIBUTES & VALUES)
        // =================================================================================

        // --- A. THUỘC TÍNH ĐỊNH LƯỢNG (Cân nặng, Thể tích) ---
        // Định nghĩa: Admin nhập Số + Chọn Đơn vị đo (KG, G)

        ProductAttribute weightAttr = createAttribute("Trọng lượng", AttributeDisplayType.RADIO, 1, UnitEnum.KG, UnitEnum.GRAM);

        // Tạo các giá trị mẫu (Hàm helper sẽ tự ghép chuỗi "1kg", "500g")
        ProductAttributeValue weight100g = createQuantitativeValue(weightAttr, new BigDecimal("100"), UnitEnum.GRAM);
        ProductAttributeValue weight500g = createQuantitativeValue(weightAttr, new BigDecimal("500"), UnitEnum.GRAM);
        ProductAttributeValue weight1kg = createQuantitativeValue(weightAttr, new BigDecimal("1"), UnitEnum.KG);
        ProductAttributeValue weight2kg = createQuantitativeValue(weightAttr, new BigDecimal("2"), UnitEnum.KG);
        ProductAttributeValue weight5kg = createQuantitativeValue(weightAttr, new BigDecimal("5"), UnitEnum.KG);
        ProductAttributeValue weight10kg = createQuantitativeValue(weightAttr, new BigDecimal("10"), UnitEnum.KG);

        ProductAttribute volumeAttr = createAttribute("Dung tích", AttributeDisplayType.SELECT, 2, UnitEnum.ML, UnitEnum.LITER);
        ProductAttributeValue vol85g = createQuantitativeValue(volumeAttr, new BigDecimal("85"), UnitEnum.GRAM); // Pate tính bằng gram
        ProductAttributeValue vol400ml = createQuantitativeValue(volumeAttr, new BigDecimal("400"), UnitEnum.ML);

        // --- B. THUỘC TÍNH ĐỊNH TÍNH (Màu sắc, Size) ---
        // Định nghĩa: Admin nhập Text hoặc Chọn Mã Màu

        ProductAttribute flavorAttr = createAttribute("Hương vị", AttributeDisplayType.SELECT, 3);
        ProductAttributeValue flavorChicken = createQualitativeValue(flavorAttr, "Gà", null);
        ProductAttributeValue flavorBeef = createQualitativeValue(flavorAttr, "Bò", null);
        ProductAttributeValue flavorTuna = createQualitativeValue(flavorAttr, "Cá ngừ", null);


        ProductAttribute colorAttr = createAttribute("Màu sắc", AttributeDisplayType.COLOR, 4);
        ProductAttributeValue colorRed = createQualitativeValue(colorAttr, "Đỏ", "#FF0000");
        ProductAttributeValue colorBlue = createQualitativeValue(colorAttr, "Xanh dương", "#0000FF");


        ProductAttribute sizeAttr = createAttribute("Kích cỡ", AttributeDisplayType.RADIO, 5);
        ProductAttributeValue sizeS = createQualitativeValue(sizeAttr, "S", null);
        ProductAttributeValue sizeM = createQualitativeValue(sizeAttr, "M", null);
        ProductAttributeValue sizeL = createQualitativeValue(sizeAttr, "L", null);


        // =================================================================================
        // 2. TẠO SẢN PHẨM VÀ BIẾN THỂ
        // =================================================================================

        // --- CASE 1: THỨC ĂN HẠT (Khác biệt Đơn vị đo & Đơn vị bán) ---
        // Attribute: 1kg (Đo lường) -> Variant: Gói (Bán hàng)
        Product dogFood = createProduct(
                "Thức ăn hạt Royal Canin Poodle Adult",
                "Thức ăn khô chuyên dụng cho giống chó Poodle trưởng thành.",
                "Thức ăn cho chó Poodle Royal Canin", "Mô tả SEO...",
                new BigDecimal("150000"), new BigDecimal("1200000"),
                "Pháp", "Ngũ cốc, Gia cầm",
                List.of(PetTypeEnum.DOG),
                getCategoryByName("Dành cho chó"),
                getBrandByName("Royal Canin"),
                List.of(getTagByName("BEST_SELLER")),
                List.of(getAgeRangeByName("ADULT"))
        );

        linkAttributesToProduct(dogFood, flavorAttr, weightAttr);

        // Vị Gà - 1kg (Bán theo GÓI)
        createVariant(dogFood, "Gà - 1kg", "RC-PD-1KG", new BigDecimal("180000"), 100, UnitEnum.PACK, flavorChicken, weight1kg);

        // Vị Bò - 10kg (Bán theo BAO TẢI)
        createVariant(dogFood, "Bò - 10kg", "RC-PD-10KG", new BigDecimal("1200000"), 10, UnitEnum.BAG, flavorBeef, weight10kg);


        // --- CASE 2: PATE MÈO (Bán Lẻ & Bán Sỉ) ---
        // Cùng 1 Attribute (85g) nhưng có 2 Variants (Lon & Thùng)
        Product catPate = createProduct(
                "Pate Whiskas Cá Ngừ",
                "Pate mèo dạng sốt thơm ngon.",
                "Pate Whiskas Tuna", "SEO...",
                new BigDecimal("15000"), new BigDecimal("340000"),
                "Thái Lan", "Cá ngừ",
                List.of(PetTypeEnum.CAT),
                getCategoryByName("Dành cho mèo"),
                getBrandByName("Whiskas"),
                List.of(getTagByName("NEW")),
                List.of(getAgeRangeByName("ALL"))
        );

        linkAttributesToProduct(catPate, flavorAttr, volumeAttr);

        // Variant 1: Mua Lẻ (1 Lon)
        createVariant(catPate, "Cá ngừ - Lon 85g", "WK-TUNA-CAN", new BigDecimal("15000"), 200, UnitEnum.CAN, flavorTuna, vol85g);

        // Variant 2: Mua Sỉ (Thùng 24 Lon)
        createVariant(catPate, "Cá ngừ - Thùng 24 Lon", "WK-TUNA-BOX", new BigDecimal("340000"), 20, UnitEnum.BOX, flavorTuna, vol85g);


        // --- CASE 3: VÒNG CỔ (Visual Color + Size) ---
        Product collar = createProduct(
                "Vòng cổ da phản quang",
                "Vòng cổ da thật an toàn.",
                "Vòng cổ phản quang", "SEO...",
                new BigDecimal("50000"), new BigDecimal("60000"),
                "Việt Nam", "Da, Nylon",
                List.of(PetTypeEnum.DOG, PetTypeEnum.CAT),
                getCategoryByName("Vòng cổ"),
                null,
                List.of(getTagByName("HOT")),
                List.of(getAgeRangeByName("ALL"))
        );

        linkAttributesToProduct(collar, colorAttr, sizeAttr);

        createVariant(collar, "Đỏ - S", "COLLAR-RED-S", new BigDecimal("50000"), 50, UnitEnum.PIECE, colorRed, sizeS);
        createVariant(collar, "Xanh - L", "COLLAR-BLUE-L", new BigDecimal("60000"), 20, UnitEnum.PIECE, colorBlue, sizeL);


        // --- CASE 4: ĐỒ CHƠI (Simple Product) ---
        Product toy = createProduct(
                "Bóng cao su siêu bền",
                "Bóng đồ chơi đàn hồi tốt.",
                "Bóng đồ chơi chó", "SEO...",
                new BigDecimal("35000"), new BigDecimal("35000"),
                "Trung Quốc", "Cao su",
                List.of(PetTypeEnum.DOG),
                getCategoryByName("Đồ chơi"),
                null,
                List.of(getTagByName("SALE")),
                List.of(getAgeRangeByName("ALL"))
        );

        createDefaultVariant(toy, new BigDecimal("35000"));

        log.info("✅ Products initialization completed!");
    }

    // =================================================================================
    // HELPER METHODS
    // =================================================================================

    private ProductAttribute createAttribute(String name, AttributeDisplayType type, int order, UnitEnum... supportedUnits) {
        return productAttributeRepository.findByName(name)
                .orElseGet(() -> {
                    ProductAttribute attr = ProductAttribute.builder()
                            .name(name)
                            .displayType(type)
                            .displayOrder(order)
                            .build();
                    if (supportedUnits != null && supportedUnits.length > 0) {
                        attr.setSupportedUnits(Arrays.asList(supportedUnits));
                    }
                    return productAttributeRepository.save(attr);
                });
    }

    // Helper tạo Value ĐỊNH LƯỢNG (Có Measurement)
    private ProductAttributeValue createQuantitativeValue(ProductAttribute attribute, BigDecimal amount, UnitEnum unit) {
        // 1. Tạo Measurement VO
        Measurement measurement = new Measurement(amount, unit);
        // 2. Lấy chuỗi hiển thị tự động (VD: "1kg")
        String displayValue = measurement.toDisplayString();

        return productAttributeValueRepository.findByAttributeAndValue(attribute, displayValue)
                .orElseGet(() -> productAttributeValueRepository.save(
                        ProductAttributeValue.builder()
                                .attribute(attribute)
                                .value(displayValue)
                                .measurement(measurement) // Lưu VO vào DB
                                .displayOrder(amount.intValue())
                                .build()
                ));
    }

    // Helper tạo Value ĐỊNH TÍNH (Chữ/Màu)
    private ProductAttributeValue createQualitativeValue(ProductAttribute attribute, String value, String displayCode) {
        return productAttributeValueRepository.findByAttributeAndValue(attribute, value)
                .orElseGet(() -> productAttributeValueRepository.save(
                        ProductAttributeValue.builder()
                                .attribute(attribute)
                                .value(value)
                                .displayCode(displayCode)
                                .measurement(null) // Không có measurement
                                .displayOrder(0)
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

    private void createVariant(Product product, String name, String skuValue, BigDecimal price, int stock, UnitEnum salesUnit, ProductAttributeValue... values) {
        if (productVariantRepository.existsBySkuValue(skuValue)) {
            return;
        }

        ProductVariant variant = ProductVariant.builder()
                .product(product)
                .name(name)
                .sku(Sku.of(skuValue))
                .price(Price.of(price))
                .stockQuantity(StockQuantity.of(stock))
                .unit(salesUnit) // Đơn vị bán (Cái, Hộp, Gói)
                .attributeValues(new ArrayList<>(Arrays.asList(values)))
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
        return productTagRepository.findAll().stream()
                .filter(t -> t.getName().contains(name))
                .findFirst().orElse(null);
    }
    private ProductAgeRange getAgeRangeByName(String name) {
        return productAgeRangeRepository.findAll().stream()
                .filter(a -> a.getName().contains(name))
                .findFirst().orElse(null);
    }
}