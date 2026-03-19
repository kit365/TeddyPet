package fpt.teddypet.application.service.products;

import fpt.teddypet.application.dto.response.product.product.ProductResponse;
import fpt.teddypet.application.dto.response.product.variant.ProductVariantResponse;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.util.Arrays;
import java.util.function.BiFunction;

/**
 * Enum định nghĩa CẤU HÌNH từng cột Excel cho tính năng Import/Export Sản phẩm.
 */
@Getter
@RequiredArgsConstructor
public enum ProductExcelColumn {

        PRODUCT_ID(0, "ID Sản Phẩm", false,
                        (p, v) -> p.productId() != null ? String.valueOf(p.productId()) : ""),

        /** Chỉ hiển thị khi xuất; khóa sửa; import không đọc cột này — slug do hệ thống sinh */
        SLUG(1, "[CHỈ XEM] Slug (hệ thống)", true,
                        (p, v) -> p.slug() != null ? p.slug() : ""),

        NAME(2, "Tên Sản Phẩm *", false,
                        (p, v) -> p.name() != null ? p.name() : ""),

        BARCODE(3, "Barcode", false,
                        (p, v) -> ""),

        STATUS(4, "Trạng Thái (mặc định: DRAFT)", false,
                        (p, v) -> p.status() != null ? p.status().name() : ""),

        DESCRIPTION(5, "Mô Tả", false,
                        (p, v) -> ""),

        BRAND(6, "Tên Thương Hiệu", false,
                        (p, v) -> p.brand() != null ? p.brand().name() : ""),

        CATEGORIES(7, "Tên Danh Mục (cách bởi dấu phẩy)", false,
                        (p, v) -> p.categories() != null
                                        ? String.join(", ", p.categories().stream().map(c -> c.name()).toList())
                                        : ""),

        TAGS(8, "Tags (cách bởi dấu phẩy)", false,
                        (p, v) -> p.tags() != null
                                        ? String.join(", ", p.tags().stream().map(t -> t.name()).toList())
                                        : ""),

        PET_TYPES(9, "Loại Thú Cưng (DOG/CAT/OTHER, cách nhau dấu ,)", false,
                        (p, v) -> ""),

        VARIANT_ID(10, "[CHỈ XEM] ID Biến Thể", true,
                        (p, v) -> v != null && v.variantId() != null ? String.valueOf(v.variantId()) : ""),

        VARIANT_NAME(11, "Tên Biến Thể", false,
                        (p, v) -> v != null && v.name() != null ? v.name() : ""),

        VARIANT_ATTRIBUTES(12, "Thuộc Tính Biến Thể (Kích cỡ:S, Màu:Đỏ)", false,
                        (p, v) -> v != null && v.attributes() != null
                                        ? String.join(", ", v.attributes().stream()
                                                        .map(a -> a.attributeName() + ": " + a.value()).toList())
                                        : ""),

        VARIANT_PRICE(13, "Giá Bán *", false,
                        (p, v) -> v != null && v.price() != null ? v.price().toPlainString() : ""),

        VARIANT_SALE_PRICE(14, "Giá Khuyến Mãi", false,
                        (p, v) -> v != null && v.salePrice() != null ? v.salePrice().toPlainString() : ""),

        VARIANT_STOCK(15, "Tồn Kho *", false,
                        (p, v) -> v != null && v.stockQuantity() != null ? String.valueOf(v.stockQuantity()) : ""),

        VARIANT_UNIT(16, "Đơn Vị *", false,
                        (p, v) -> v != null && v.unit() != null ? v.unit().name() : ""),

        VARIANT_WEIGHT(17, "Trọng Lượng (g)", false,
                        (p, v) -> v != null && v.weight() != null ? String.valueOf(v.weight()) : ""),

        PRODUCT_IMAGE_URLS(18, "Hình Ảnh SP (URL, cách bởi dấu phẩy)", false,
                        (p, v) -> p.images() != null
                                        ? String.join(", ", p.images().stream().map(i -> i.imageUrl()).toList())
                                        : ""),

        VARIANT_FEATURED_IMAGE_URL(19, "Hình Ảnh Biến Thể (URL)", false,
                        (p, v) -> v != null && v.featuredImageUrl() != null ? v.featuredImageUrl() : "");

        private final int index;
        private final String header;
        private final boolean readOnly;
        private final BiFunction<ProductResponse, ProductVariantResponse, String> dataExtractor;

        public static int firstReadOnlyIndex() {
                return Arrays.stream(values())
                                .filter(ProductExcelColumn::isReadOnly)
                                .mapToInt(ProductExcelColumn::getIndex)
                                .min().orElse(values().length);
        }

        public static int lastReadOnlyIndex() {
                return Arrays.stream(values())
                                .filter(ProductExcelColumn::isReadOnly)
                                .mapToInt(ProductExcelColumn::getIndex)
                                .max().orElse(values().length - 1);
        }

        public static int totalColumns() {
                return values().length;
        }
}
