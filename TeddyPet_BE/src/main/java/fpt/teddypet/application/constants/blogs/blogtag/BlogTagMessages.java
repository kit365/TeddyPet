package fpt.teddypet.application.constants.blogs.blogtag;

public final class BlogTagMessages {

    private BlogTagMessages() {
        // Utility class
    }

    // Success messages
    public static final String MESSAGE_BLOG_TAG_CREATED_SUCCESS = "Tạo thẻ bài viết thành công.";
    public static final String MESSAGE_BLOG_TAG_UPDATED_SUCCESS = "Cập nhật thẻ bài viết thành công.";
    public static final String MESSAGE_BLOG_TAG_DELETED_SUCCESS = "Xóa thẻ bài viết thành công.";

    // Error messages
    public static final String MESSAGE_BLOG_TAG_NOT_FOUND = "Không tìm thấy thẻ bài viết.";
    public static final String MESSAGE_BLOG_TAG_NOT_FOUND_BY_ID = "Không tìm thấy thẻ bài viết với ID: %s";
    public static final String MESSAGE_BLOG_TAG_NAME_ALREADY_EXISTS = "Tên thẻ '%s' đã tồn tại.";
    public static final String MESSAGE_BLOG_TAG_SLUG_ALREADY_EXISTS = "Slug '%s' đã tồn tại.";
}
