package fpt.teddypet.application.constants.blogs.blogpost;

public final class BlogPostLogMessages {

    private BlogPostLogMessages() {
        // Utility class
    }

    public static final String LOG_BLOG_POST_CREATE_START = "Bắt đầu tạo bài viết: {}";
    public static final String LOG_BLOG_POST_CREATE_SUCCESS = "Tạo bài viết thành công với ID: {}";
    public static final String LOG_BLOG_POST_UPDATE_START = "Bắt đầu cập nhật bài viết ID: {}";
    public static final String LOG_BLOG_POST_UPDATE_SUCCESS = "Cập nhật bài viết thành công với ID: {}";
    public static final String LOG_BLOG_POST_GET_BY_ID = "Lấy bài viết với ID: {}";
    public static final String LOG_BLOG_POST_GET_BY_SLUG = "Lấy bài viết với slug: {}";
    public static final String LOG_BLOG_POST_GET_ALL = "Lấy tất cả {} bài viết";
    public static final String LOG_BLOG_POST_GET_BY_CATEGORY = "Lấy {} bài viết của danh mục ID: {}";
    public static final String LOG_BLOG_POST_GET_BY_STATUS = "Lấy {} bài viết với trạng thái: {}";
    public static final String LOG_BLOG_POST_DELETE_START = "Bắt đầu xóa bài viết ID: {}";
    public static final String LOG_BLOG_POST_DELETE_SUCCESS = "Xóa bài viết thành công với ID: {}";
    public static final String LOG_BLOG_POST_INCREMENT_VIEW = "Tăng lượt xem cho bài viết ID: {}";
}
