package fpt.teddypet.application.constants.products.productvariant;

public final class ProductVariantMessages {

    private ProductVariantMessages() {
        // Utility class - prevent instantiation
    }

    // Success messages
    public static final String MESSAGE_PRODUCT_VARIANT_CREATED_SUCCESS = "Tạo biến thể sản phẩm thành công.";
    public static final String MESSAGE_PRODUCT_VARIANT_UPDATED_SUCCESS = "Cập nhật biến thể sản phẩm thành công.";
    public static final String MESSAGE_PRODUCT_VARIANT_DELETED_SUCCESS = "Xóa biến thể sản phẩm thành công.";
    public static final String MESSAGE_PRODUCT_VARIANTS_BATCH_CREATED_SUCCESS = "Tạo các biến thể sản phẩm thành công.";
    public static final String MESSAGE_PRODUCT_VARIANTS_SYNC_SUCCESS = "Đồng bộ biến thể sản phẩm thành công.";

    // Error messages
    public static final String MESSAGE_PRODUCT_VARIANT_NOT_FOUND = "Không tìm thấy biến thể sản phẩm.";
    public static final String MESSAGE_PRODUCT_VARIANT_NOT_FOUND_BY_ID = "Không tìm thấy biến thể sản phẩm với ID: %s";
    public static final String MESSAGE_SKU_ALREADY_EXISTS = "SKU đã được sử dụng bởi biến thể khác.";
    public static final String MESSAGE_SKU_DUPLICATE_IN_BATCH = "SKU phải là duy nhất trong batch.";
    public static final String MESSAGE_VARIANTS_LIST_EMPTY = "Danh sách biến thể sản phẩm không được rỗng.";
    public static final String MESSAGE_INVALID_PRICE = "Giá phải lớn hơn 0.";
    public static final String MESSAGE_INVALID_SALE_PRICE = "Giá khuyến mãi phải bằng 0 hoặc nhỏ hơn giá gốc.";
    public static final String MESSAGE_INVALID_STOCK = "Số lượng tồn kho phải >= 0.";
    public static final String MESSAGE_PRODUCT_VARIANT_NOT_AVAILABLE = "Biến thể sản phẩm với ID %d không còn khả dụng.";
}
