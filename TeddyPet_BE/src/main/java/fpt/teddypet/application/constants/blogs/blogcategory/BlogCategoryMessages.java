package fpt.teddypet.application.constants.blogs.blogcategory;

public final class BlogCategoryMessages {

    private BlogCategoryMessages() {
        // Utility class
    }

    // Success messages
    public static final String MESSAGE_BLOG_CATEGORY_CREATED_SUCCESS = "Tạo danh mục blog thành công.";
    public static final String MESSAGE_BLOG_CATEGORY_UPDATED_SUCCESS = "Cập nhật danh mục blog thành công.";
    public static final String MESSAGE_BLOG_CATEGORY_DELETED_SUCCESS = "Xóa danh mục blog thành công.";

    // Error messages
    public static final String MESSAGE_BLOG_CATEGORY_NOT_FOUND = "Không tìm thấy danh mục blog.";
    public static final String MESSAGE_BLOG_CATEGORY_NOT_FOUND_BY_ID = "Không tìm thấy danh mục blog với ID: %s";
    public static final String MESSAGE_BLOG_CATEGORY_PARENT_NOT_FOUND = "Không tìm thấy danh mục cha với ID: %s";
    public static final String MESSAGE_BLOG_CATEGORY_CIRCULAR_REFERENCE = "Không thể đặt danh mục cha là chính nó hoặc con cháu của nó.";
    public static final String MESSAGE_BLOG_CATEGORY_SLUG_ALREADY_EXISTS = "Slug '%s' đã tồn tại.";
}
