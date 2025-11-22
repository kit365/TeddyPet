package fpt.teddypet.application.constants.blogs.blogpost;

public final class BlogPostMessages {

    private BlogPostMessages() {
        // Utility class
    }

    // Success messages
    public static final String MESSAGE_BLOG_POST_CREATED_SUCCESS = "Tạo bài viết thành công.";
    public static final String MESSAGE_BLOG_POST_UPDATED_SUCCESS = "Cập nhật bài viết thành công.";
    public static final String MESSAGE_BLOG_POST_DELETED_SUCCESS = "Xóa bài viết thành công.";
    public static final String MESSAGE_BLOG_POST_PUBLISHED_SUCCESS = "Xuất bản bài viết thành công.";

    // Error messages
    public static final String MESSAGE_BLOG_POST_NOT_FOUND = "Không tìm thấy bài viết.";
    public static final String MESSAGE_BLOG_POST_NOT_FOUND_BY_ID = "Không tìm thấy bài viết với ID: %s";
    public static final String MESSAGE_BLOG_POST_NOT_FOUND_BY_SLUG = "Không tìm thấy bài viết với slug: %s";
    public static final String MESSAGE_BLOG_POST_SLUG_ALREADY_EXISTS = "Slug '%s' đã tồn tại.";
}
