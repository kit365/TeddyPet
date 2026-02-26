package fpt.teddypet.infrastructure.persistence.postgres.data;

import fpt.teddypet.application.util.SlugUtil;
import fpt.teddypet.domain.entity.*;
import fpt.teddypet.domain.enums.AttributeDisplayType;
import fpt.teddypet.domain.enums.PetTypeEnum;
import fpt.teddypet.domain.enums.ProductStatusEnum;
import fpt.teddypet.domain.enums.ProductTypeEnum;
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
        private final ProductImageRepository productImageRepository;

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

                ProductAttribute weightAttr = createAttribute("Trọng lượng", AttributeDisplayType.RADIO, 1, UnitEnum.KG,
                                UnitEnum.GRAM);

                // Tạo các giá trị mẫu (Hàm helper sẽ tự ghép chuỗi "1kg", "500g")
                ProductAttributeValue weight100g = createQuantitativeValue(weightAttr, new BigDecimal("100"),
                                UnitEnum.GRAM);
                ProductAttributeValue weight500g = createQuantitativeValue(weightAttr, new BigDecimal("500"),
                                UnitEnum.GRAM);
                ProductAttributeValue weight1kg = createQuantitativeValue(weightAttr, new BigDecimal("1"), UnitEnum.KG);
                ProductAttributeValue weight2kg = createQuantitativeValue(weightAttr, new BigDecimal("2"), UnitEnum.KG);
                ProductAttributeValue weight5kg = createQuantitativeValue(weightAttr, new BigDecimal("5"), UnitEnum.KG);
                ProductAttributeValue weight10kg = createQuantitativeValue(weightAttr, new BigDecimal("10"),
                                UnitEnum.KG);

                ProductAttribute volumeAttr = createAttribute("Dung tích", AttributeDisplayType.SELECT, 2, UnitEnum.ML,
                                UnitEnum.LITER);
                ProductAttributeValue vol85g = createQuantitativeValue(volumeAttr, new BigDecimal("85"), UnitEnum.GRAM); // Pate
                                                                                                                         // tính
                                                                                                                         // bằng
                                                                                                                         // gram
                ProductAttributeValue vol400ml = createQuantitativeValue(volumeAttr, new BigDecimal("400"),
                                UnitEnum.ML);

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
                                List.of(getAgeRangeByName("ADULT")));
                dogFood.setProductType(ProductTypeEnum.VARIABLE);

                ProductImage dogImg1 = createProductImage(dogFood,
                                "https://images.unsplash.com/photo-1517849845537-4d257902454a",
                                "Poodle Adult 1",
                                0);
                ProductImage dogImg2 = createProductImage(dogFood,
                                "https://images.unsplash.com/photo-1598133894008-61f7fdb8cc3a",
                                "Poodle Adult 2",
                                1);

                linkAttributesToProduct(dogFood, flavorAttr, weightAttr);

                // Vị Gà - 1kg (Bán theo GÓI)
                createVariant(dogFood, "Gà - 1kg", "RC-PD-1KG", new BigDecimal("180000"), 100, UnitEnum.PACK,
                                dogImg1,
                                flavorChicken,
                                weight1kg);

                // Vị Bò - 10kg (Bán theo BAO TẢI)
                createVariant(dogFood, "Bò - 10kg", "RC-PD-10KG", new BigDecimal("1200000"), 10, UnitEnum.BAG,
                                dogImg2,
                                flavorBeef,
                                weight10kg);

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
                                List.of(getAgeRangeByName("ALL")));
                catPate.setProductType(ProductTypeEnum.VARIABLE);

                ProductImage catImg1 = createProductImage(catPate,
                                "https://images.unsplash.com/photo-1591768793355-74d7c0d3a75c",
                                "Whiskas Tuna 1",
                                0);
                ProductImage catImg2 = createProductImage(catPate,
                                "https://images.unsplash.com/photo-1574158622682-e40e69881006",
                                "Whiskas Tuna 2",
                                1);

                linkAttributesToProduct(catPate, flavorAttr, volumeAttr);

                // Variant 1: Mua Lẻ (1 Lon)
                createVariant(catPate, "Cá ngừ - Lon 85g", "WK-TUNA-CAN", new BigDecimal("15000"), 200, UnitEnum.CAN,
                                catImg1, flavorTuna, vol85g);

                // Variant 2: Mua Sỉ (Thùng 24 Lon)
                createVariant(catPate, "Cá ngừ - Thùng 24 Lon", "WK-TUNA-BOX", new BigDecimal("340000"), 20,
                                UnitEnum.BOX,
                                catImg2,
                                flavorTuna, vol85g);

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
                                List.of(getAgeRangeByName("ALL")));
                collar.setProductType(ProductTypeEnum.VARIABLE);

                ProductImage collarImg1 = createProductImage(collar,
                                "https://images.unsplash.com/photo-1591047139829-d91aecb6caea",
                                "Collar Red 1", 0);
                ProductImage collarImg2 = createProductImage(collar,
                                "https://images.unsplash.com/photo-1623903088095-d300c83aa3d1",
                                "Collar Blue 1", 1);

                linkAttributesToProduct(collar, colorAttr, sizeAttr);

                createVariant(collar, "Đỏ - S", "COLLAR-RED-S", new BigDecimal("50000"), 50, UnitEnum.PIECE, collarImg1,
                                colorRed,
                                sizeS);
                createVariant(collar, "Xanh - L", "COLLAR-BLUE-L", new BigDecimal("60000"), 20, UnitEnum.PIECE,
                                collarImg2,
                                colorBlue,
                                sizeL);

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
                                List.of(getAgeRangeByName("ALL")));
                toy.setProductType(ProductTypeEnum.SIMPLE);

                ProductImage toyImg1 = createProductImage(toy,
                                "https://images.unsplash.com/photo-1576049671415-0aa834b768a4", "Bóng cao su 1",
                                0);
                createProductImage(toy, "https://images.unsplash.com/photo-1581550461937-047979601d8b", "Bóng cao su 2",
                                1);

                createDefaultVariant(toy, new BigDecimal("35000"), toyImg1);

                // =================================================================================
                // 3. SẢN PHẨM BỔ SUNG (để test tính năng "Sản phẩm liên quan")
                // =================================================================================

                // --- CASE 5: THỨC ĂN HẠT PEDIGREE (Cùng danh mục "Dành cho chó") ---
                Product dogFood2 = createProduct(
                                "Thức ăn hạt Pedigree cho chó con",
                                "Thức ăn hạt Pedigree dành cho chó con dưới 12 tháng, bổ sung DHA giúp phát triển trí não.",
                                "Pedigree Puppy", "Thức ăn cho chó con Pedigree",
                                new BigDecimal("89000"), new BigDecimal("89000"),
                                "Mỹ", "Ngũ cốc, Thịt gà",
                                List.of(PetTypeEnum.DOG),
                                getCategoryByName("Dành cho chó"),
                                null,
                                List.of(getTagByName("NEW")),
                                List.of(getAgeRangeByName("PUPPY")));
                dogFood2.setProductType(ProductTypeEnum.SIMPLE);

                ProductImage dogFood2Img1 = createProductImage(dogFood2,
                                "https://images.unsplash.com/photo-1587300003388-59208cc962cb",
                                "Pedigree Puppy 1", 0);
                createProductImage(dogFood2,
                                "https://images.unsplash.com/photo-1560807707-8cc77767d783",
                                "Pedigree Puppy 2", 1);

                createDefaultVariant(dogFood2, new BigDecimal("89000"), dogFood2Img1);

                // --- CASE 6: SNACK JERHIGH (Cùng danh mục "Dành cho chó") ---
                Product dogSnack = createProduct(
                                "Snack thưởng Jerhigh Stick cho chó",
                                "Thanh snack thưởng Jerhigh dành cho chó, vị gà thật 100%, giúp răng miệng chắc khỏe.",
                                "Jerhigh Stick Dog Snack", "Snack cho chó Jerhigh",
                                new BigDecimal("25000"), new BigDecimal("25000"),
                                "Thái Lan", "Thịt gà",
                                List.of(PetTypeEnum.DOG),
                                getCategoryByName("Dành cho chó"),
                                null,
                                List.of(getTagByName("SALE")),
                                List.of(getAgeRangeByName("ALL")));
                dogSnack.setProductType(ProductTypeEnum.SIMPLE);

                ProductImage dogSnackImg1 = createProductImage(dogSnack,
                                "https://images.unsplash.com/photo-1601758228041-f3b2795255f1",
                                "Jerhigh Stick 1", 0);
                createProductImage(dogSnack,
                                "https://images.unsplash.com/photo-1583337130417-13104dec14a3",
                                "Jerhigh Stick 2", 1);

                createDefaultVariant(dogSnack, new BigDecimal("25000"), dogSnackImg1);

                // --- CASE 7: THỨC ĂN ƯỚT SMARTHEART (Cùng danh mục "Dành cho chó") ---
                Product dogWetFood = createProduct(
                                "Thức ăn ướt SmartHeart cho chó vị bò nướng",
                                "Thức ăn ướt SmartHeart cho chó trưởng thành, hương vị bò nướng hấp dẫn, giàu protein và vitamin.",
                                "SmartHeart Beef Dog Food", "Thức ăn ướt cho chó SmartHeart",
                                new BigDecimal("28000"), new BigDecimal("35000"),
                                "Thái Lan", "Thịt bò, rau củ",
                                List.of(PetTypeEnum.DOG),
                                getCategoryByName("Dành cho chó"),
                                null,
                                List.of(getTagByName("SALE")),
                                List.of(getAgeRangeByName("ADULT")));
                dogWetFood.setProductType(ProductTypeEnum.SIMPLE);

                ProductImage dogWetFoodImg1 = createProductImage(dogWetFood,
                                "https://images.unsplash.com/photo-1558618666-fcd25c85f82e",
                                "SmartHeart Beef 1", 0);
                createProductImage(dogWetFood,
                                "https://images.unsplash.com/photo-1548199973-03cce0bbc87b",
                                "SmartHeart Beef 2", 1);

                createVariantWithSale(dogWetFood, "Lon 400g", "SH-BEEF-400", new BigDecimal("35000"),
                                new BigDecimal("28000"), 80, UnitEnum.CAN, dogWetFoodImg1);

                // --- CASE 8: THỨC ĂN HẠT ME-O (Cùng danh mục "Dành cho mèo") ---
                Product catFood2 = createProduct(
                                "Thức ăn hạt Me-O cho mèo trưởng thành vị cá ngừ",
                                "Thức ăn hạt Me-O dành cho mèo trưởng thành, vị cá ngừ thơm ngon, giàu Taurine giúp sáng mắt.",
                                "Me-O Tuna Adult Cat", "Thức ăn cho mèo Me-O",
                                new BigDecimal("65000"), new BigDecimal("65000"),
                                "Thái Lan", "Cá ngừ, Ngũ cốc",
                                List.of(PetTypeEnum.CAT),
                                getCategoryByName("Dành cho mèo"),
                                null,
                                List.of(getTagByName("BEST_SELLER")),
                                List.of(getAgeRangeByName("ADULT")));
                catFood2.setProductType(ProductTypeEnum.SIMPLE);

                ProductImage catFood2Img1 = createProductImage(catFood2,
                                "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba",
                                "Me-O Tuna 1", 0);
                createProductImage(catFood2,
                                "https://images.unsplash.com/photo-1573865526739-10659fec78a5",
                                "Me-O Tuna 2", 1);

                createDefaultVariant(catFood2, new BigDecimal("65000"), catFood2Img1);

                // --- CASE 9: CÁT VỆ SINH MÈO (Cùng danh mục "Dành cho mèo") ---
                Product catLitter = createProduct(
                                "Cát vệ sinh đậu nành cho mèo Cat's Best",
                                "Cát vệ sinh hữu cơ từ đậu nành, không bụi, khử mùi mạnh, an toàn cho mèo.",
                                "Cat's Best Soybean Litter", "Cát vệ sinh cho mèo",
                                new BigDecimal("120000"), new BigDecimal("120000"),
                                "Đức", "Đậu nành",
                                List.of(PetTypeEnum.CAT),
                                getCategoryByName("Dành cho mèo"),
                                null,
                                List.of(getTagByName("HOT")),
                                List.of(getAgeRangeByName("ALL")));
                catLitter.setProductType(ProductTypeEnum.SIMPLE);

                ProductImage catLitterImg1 = createProductImage(catLitter,
                                "https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13",
                                "Cat Litter 1", 0);
                createProductImage(catLitter,
                                "https://images.unsplash.com/photo-1495360010541-f48722b34f7d",
                                "Cat Litter 2", 1);

                createDefaultVariant(catLitter, new BigDecimal("120000"), catLitterImg1);

                log.info("✅ Products initialization completed!");
        }

        // =================================================================================
        // HELPER METHODS
        // =================================================================================

        private ProductAttribute createAttribute(String name, AttributeDisplayType type, int order,
                        UnitEnum... supportedUnits) {
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
        private ProductAttributeValue createQuantitativeValue(ProductAttribute attribute, BigDecimal amount,
                        UnitEnum unit) {
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
                                                                .build()));
        }

        // Helper tạo Value ĐỊNH TÍNH (Chữ/Màu)
        private ProductAttributeValue createQualitativeValue(ProductAttribute attribute, String value,
                        String displayCode) {
                return productAttributeValueRepository.findByAttributeAndValue(attribute, value)
                                .orElseGet(() -> productAttributeValueRepository.save(
                                                ProductAttributeValue.builder()
                                                                .attribute(attribute)
                                                                .value(value)
                                                                .displayCode(displayCode)
                                                                .measurement(null) // Không có measurement
                                                                .displayOrder(0)
                                                                .build()));
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
                                .status(ProductStatusEnum.ACTIVE)
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

        private ProductImage createProductImage(Product product, String url, String altText, int order) {
                ProductImage image = ProductImage.builder()
                                .product(product)
                                .imageUrl(url)
                                .altText(altText)
                                .displayOrder(order)
                                .isActive(true)
                                .isDeleted(false)
                                .build();
                return productImageRepository.save(image);
        }

        private void linkAttributesToProduct(Product product, ProductAttribute... attributes) {
                product.getAttributes().clear();
                product.getAttributes().addAll(Arrays.asList(attributes));
                productRepository.save(product);
        }

        private void createVariant(Product product, String name, String skuValue, BigDecimal price, int stock,
                        UnitEnum salesUnit, ProductImage featuredImage, ProductAttributeValue... values) {
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
                                .featuredImage(featuredImage)
                                .status(ProductStatusEnum.ACTIVE)
                                .isActive(true)
                                .isDeleted(false)
                                .build();

                product.getVariants().add(variant);
                productVariantRepository.save(variant);
        }

        private void createVariantWithSale(Product product, String name, String skuValue, BigDecimal price,
                        BigDecimal salePrice, int stock, UnitEnum salesUnit, ProductImage featuredImage) {
                if (productVariantRepository.existsBySkuValue(skuValue)) {
                        return;
                }

                ProductVariant variant = ProductVariant.builder()
                                .product(product)
                                .name(name)
                                .sku(Sku.of(skuValue))
                                .price(Price.of(price, salePrice))
                                .stockQuantity(StockQuantity.of(stock))
                                .unit(salesUnit)
                                .attributeValues(new ArrayList<>())
                                .featuredImage(featuredImage)
                                .status(ProductStatusEnum.ACTIVE)
                                .isActive(true)
                                .isDeleted(false)
                                .build();

                product.getVariants().add(variant);
                productVariantRepository.save(variant);
        }

        private void createDefaultVariant(Product product, BigDecimal price, ProductImage featuredImage) {
                if (!product.getVariants().isEmpty())
                        return;
                String sku = "SKU-" + product.getSlug().toUpperCase().replace("-", "");

                ProductVariant variant = ProductVariant.builder()
                                .product(product)
                                .name("Default")
                                .sku(Sku.of(sku))
                                .price(Price.of(price))
                                .stockQuantity(StockQuantity.of(100))
                                .unit(UnitEnum.PIECE)
                                .featuredImage(featuredImage)
                                .status(ProductStatusEnum.ACTIVE)
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