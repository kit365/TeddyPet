package fpt.teddypet.application.constants.products.productcategory;

public final class ProductCategoryMessages {

    private ProductCategoryMessages() {
        // Utility class - prevent instantiation
    }

    // Success messages
    public static final String MESSAGE_PRODUCT_CATEGORY_CREATED_SUCCESS = "Tạo danh mục sản phẩm thành công.";
    public static final String MESSAGE_PRODUCT_CATEGORY_UPDATED_SUCCESS = "Cập nhật danh mục sản phẩm thành công.";
    public static final String MESSAGE_PRODUCT_CATEGORY_UPSERT_SUCCESS = "Tạo/cập nhật danh mục sản phẩm thành công.";
    public static final String MESSAGE_PRODUCT_CATEGORY_DELETED_SUCCESS = "Xóa danh mục sản phẩm thành công.";

    // Error messages
    public static final String MESSAGE_PRODUCT_CATEGORY_NOT_FOUND = "Không tìm thấy danh mục sản phẩm.";
    public static final String MESSAGE_PRODUCT_CATEGORY_NOT_FOUND_BY_ID = "Không tìm thấy danh mục sản phẩm với ID: %s";
    public static final String MESSAGE_PRODUCT_CATEGORY_PARENT_NOT_FOUND = "Không tìm thấy danh mục cha với ID: %s";
    public static final String MESSAGE_PRODUCT_CATEGORY_CIRCULAR_REFERENCE = "Không thể đặt danh mục cha là chính nó hoặc con cháu của nó.";
}

