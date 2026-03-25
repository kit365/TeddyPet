package fpt.teddypet.application.constants.blogs.blogtag;

public final class BlogTagLogMessages {

    private BlogTagLogMessages() {
        // Utility class
    }

    public static final String LOG_BLOG_TAG_UPSERT_START = "Bắt đầu tạo/cập nhật tag blog: {}";
    public static final String LOG_BLOG_TAG_UPSERT_SUCCESS = "Tạo/cập nhật tag blog thành công với ID: {}";
    public static final String LOG_BLOG_TAG_GET_BY_ID = "Lấy tag blog với ID: {}";
    public static final String LOG_BLOG_TAG_GET_ALL = "Lấy tất cả {} tag blog";
    public static final String LOG_BLOG_TAG_DELETE_START = "Bắt đầu xóa tag blog ID: {}";
    public static final String LOG_BLOG_TAG_DELETE_SUCCESS = "Xóa tag blog thành công với ID: {}";
    public static final String LOG_BLOG_TAG_NAME_VALIDATION_FAILED = " Validation failed for tag name: {}";
}
