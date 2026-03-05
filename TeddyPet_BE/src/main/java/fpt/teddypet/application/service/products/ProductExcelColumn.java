package fpt.teddypet.application.service.products;

import fpt.teddypet.application.dto.response.product.product.ProductResponse;
import fpt.teddypet.application.dto.response.product.variant.ProductVariantResponse;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.util.Arrays;
import java.util.function.BiFunction;

/**
 * Enum định nghĩa CẤU HÌNH từng cột Excel cho tính năng Import/Export Sản phẩm.
 *
 * Lợi ích:
 * - Thêm/xóa/di chuyển cột chỉ cần sửa Enum này, không động vào Service
 * - isReadOnly tự động điều khiển việc khóa sheet, tô màu header
 * - dataExtractor giúp fillDataRow() không cần if-else cho từng cột
 */
@Getter
@RequiredArgsConstructor
public enum ProductExcelColumn {

        // ─── CỘT SẢN PHẨM (0-7): Người dùng có thể chỉnh sửa ───────────────────

        PRODUCT_ID(0, "ID Sản Phẩm", false,
                        (p, v) -> p.productId() != null ? String.valueOf(p.productId()) : ""),

        // Slug KHÔNG có trong template - BE tự generate từ tên sản phẩm

        NAME(1, "Tên Sản Phẩm *", false,
                        (p, v) -> p.name() != null ? p.name() : ""),

        BARCODE(2, "Barcode", false,
                        (p, v) -> ""), // Không có trong ProductResponse - để trống khi export

        STATUS(3, "Trạng Thái (mặc định: DRAFT)", false,
                        (p, v) -> p.status() != null ? p.status().name() : ""),

        DESCRIPTION(4, "Mô Tả", false,
                        (p, v) -> ""), // Không có trong ProductResponse - để trống khi export

        BRAND(5, "Tên Thương Hiệu", false,
                        (p, v) -> p.brand() != null ? p.brand().name() : ""),

        CATEGORIES(6, "Tên Danh Mục (cách bởi dấu phẩy)", false,
                        (p, v) -> p.categories() != null
                                        ? String.join(", ", p.categories().stream().map(c -> c.name()).toList())
                                        : ""),

        PET_TYPES(7, "Loại Thú Cưng (DOG/CAT/OTHER, cách nhau dấu ,)", false,
                        (p, v) -> ""), // Không có trong ProductResponse - để trống khi export

        // ─── CỘT BIẾN THỂ (8-15): CHỈ XEM - không được import ──────────────────

        VARIANT_ID(8, "[CHỈ XEM] ID Biến ThỂ", true,
                        (p, v) -> v != null && v.variantId() != null ? String.valueOf(v.variantId()) : ""),

        VARIANT_NAME(9, "[CHỈ XEM] Tên Biến ThỂ", true,
                        (p, v) -> v != null && v.name() != null ? v.name() : ""),

        VARIANT_ATTRIBUTES(10, "[CHỈ XEM] Thuộc Tính (Kích cỡ:S, Màu:Đỏ)", true,
                        (p, v) -> v != null && v.attributes() != null
                                        ? String.join(", ", v.attributes().stream()
                                                        .map(a -> a.attributeName() + ": " + a.value()).toList())
                                        : ""),

        VARIANT_PRICE(11, "[CHỈ XEM] Giá Bán", true,
                        (p, v) -> v != null && v.price() != null ? v.price().toPlainString() : ""),

        VARIANT_SALE_PRICE(12, "[CHỈ XEM] Giá Khuyến Mãi", true,
                        (p, v) -> v != null && v.salePrice() != null ? v.salePrice().toPlainString() : ""),

        VARIANT_STOCK(13, "[CHỈ XEM] Tồn Kho", true,
                        (p, v) -> v != null && v.stockQuantity() != null ? String.valueOf(v.stockQuantity()) : ""),

        VARIANT_UNIT(14, "[CHỈ XEM] Đơn Vị", true,
                        (p, v) -> v != null && v.unit() != null ? v.unit().name() : ""),

        VARIANT_WEIGHT(15, "[CHỈ XEM] Trọng Lượng (g)", true,
                        (p, v) -> v != null && v.weight() != null ? String.valueOf(v.weight()) : "");

        // ─── Fields ──────────────────────────────────────────────────────────────

        private final int index;
        private final String header;
        private final boolean readOnly;
        private final BiFunction<ProductResponse, ProductVariantResponse, String> dataExtractor;

        // ─── Static helpers ───────────────────────────────────────────────────────

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
