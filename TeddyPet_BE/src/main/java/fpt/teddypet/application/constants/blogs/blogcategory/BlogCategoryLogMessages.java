package fpt.teddypet.application.constants.blogs.blogcategory;

public final class BlogCategoryLogMessages {

    private BlogCategoryLogMessages() {
        // Utility class
    }

    public static final String LOG_BLOG_CATEGORY_UPSERT_START = "Bắt đầu tạo/cập nhật danh mục blog: {}";
    public static final String LOG_BLOG_CATEGORY_UPSERT_SUCCESS = "Tạo/cập nhật danh mục blog thành công với ID: {}";
    public static final String LOG_BLOG_CATEGORY_GET_BY_ID = "Lấy danh mục blog với ID: {}";
    public static final String LOG_BLOG_CATEGORY_GET_ALL = "Lấy tất cả {} danh mục blog";
    public static final String LOG_BLOG_CATEGORY_GET_ROOT_CATEGORIES = "Lấy {} danh mục blog gốc";
    public static final String LOG_BLOG_CATEGORY_GET_CHILD_CATEGORIES = "Lấy {} danh mục blog con của parent ID: {}";
    public static final String LOG_BLOG_CATEGORY_GET_NESTED_CATEGORIES = "Lấy cây danh mục blog với {} danh mục gốc";
    public static final String LOG_BLOG_CATEGORY_DELETE_START = "Bắt đầu xóa danh mục blog với ID: {}";
    public static final String LOG_BLOG_CATEGORY_DELETE_SUCCESS = "Xóa danh mục blog thành công với ID: {}";
    public static final String LOG_BLOG_CATEGORY_CIRCULAR_REFERENCE = "Phát hiện tham chiếu vòng cho danh mục blog ID: {}";
    public static final String LOG_BLOG_CATEGORY_SLUG_ALREADY_EXISTS = "Slug đã tồn tại: {}";
}
