package fpt.teddypet.application.constants.productcategory;

public final class ProductCategoryLogMessages {

    private ProductCategoryLogMessages() {
        // Utility class - prevent instantiation
    }

    // Log messages for upsert
    public static final String LOG_PRODUCT_CATEGORY_UPSERT_START = "Bắt đầu tạo/cập nhật danh mục sản phẩm với tên: {}";
    public static final String LOG_PRODUCT_CATEGORY_UPSERT_SUCCESS = "Tạo/cập nhật danh mục sản phẩm thành công. Category ID: {}";
    public static final String LOG_PRODUCT_CATEGORY_UPSERT_ERROR = "Lỗi khi tạo/cập nhật danh mục sản phẩm: {}";

    // Log messages for get
    public static final String LOG_PRODUCT_CATEGORY_GET_BY_ID = "Lấy danh mục sản phẩm theo ID: {}";
    public static final String LOG_PRODUCT_CATEGORY_GET_ALL = "Lấy danh sách tất cả danh mục sản phẩm, số lượng: {}";
    public static final String LOG_PRODUCT_CATEGORY_GET_ROOT_CATEGORIES = "Lấy danh sách danh mục cha, số lượng: {}";
    public static final String LOG_PRODUCT_CATEGORY_GET_CHILD_CATEGORIES = "Lấy danh sách danh mục con của parentId: {}, số lượng: {}";
    public static final String LOG_PRODUCT_CATEGORY_GET_NESTED_CATEGORIES = "Lấy danh sách danh mục lồng nhau, số lượng root: {}";

    // Log messages for delete
    public static final String LOG_PRODUCT_CATEGORY_DELETE_START = "Bắt đầu xóa danh mục sản phẩm ID: {}";
    public static final String LOG_PRODUCT_CATEGORY_DELETE_SUCCESS = "Xóa danh mục sản phẩm thành công. Category ID: {}";
    public static final String LOG_PRODUCT_CATEGORY_DELETE_ERROR = "Lỗi khi xóa danh mục sản phẩm: {}";

    // Log messages for validation
    public static final String LOG_PRODUCT_CATEGORY_CIRCULAR_REFERENCE = "Phát hiện circular reference khi đặt parent cho category ID: {}";
}

