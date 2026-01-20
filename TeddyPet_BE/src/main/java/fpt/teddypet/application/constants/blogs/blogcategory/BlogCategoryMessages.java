package fpt.teddypet.application.constants.blogs.blogcategory;

public final class BlogCategoryMessages {

    private BlogCategoryMessages() {
        // Utility class
    }

    // Success messages
    public static final String MESSAGE_BLOG_CATEGORY_CREATED_SUCCESS = "Tạo danh mục bài viết thành công.";
    public static final String MESSAGE_BLOG_CATEGORY_UPDATED_SUCCESS = "Cập nhật danh mục bài viết thành công.";
    public static final String MESSAGE_BLOG_CATEGORY_DELETED_SUCCESS = "Xóa danh mục bài viết thành công.";

    // Error messages
    public static final String MESSAGE_BLOG_CATEGORY_NOT_FOUND = "Không tìm thấy danh mục bài viết.";
    public static final String MESSAGE_BLOG_CATEGORY_NOT_FOUND_BY_ID = "Không tìm thấy danh mục bài viết với ID: %s";
    public static final String MESSAGE_BLOG_CATEGORY_PARENT_NOT_FOUND = "Không tìm thấy danh mục cha với ID: %s";
    public static final String MESSAGE_BLOG_CATEGORY_CIRCULAR_REFERENCE = "Không thể đặt danh mục cha là chính nó hoặc danh mục con của nó.";
    public static final String MESSAGE_BLOG_CATEGORY_SLUG_ALREADY_EXISTS = "Slug '%s' đã tồn tại.";
}
