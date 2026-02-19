package fpt.teddypet.application.constants.services.servicecategory;

public final class ServiceCategoryMessages {

    private ServiceCategoryMessages() {
    }

    public static final String MESSAGE_SERVICE_CATEGORY_CREATED_SUCCESS = "Tạo danh mục dịch vụ thành công.";
    public static final String MESSAGE_SERVICE_CATEGORY_UPDATED_SUCCESS = "Cập nhật danh mục dịch vụ thành công.";
    public static final String MESSAGE_SERVICE_CATEGORY_DELETED_SUCCESS = "Xóa danh mục dịch vụ thành công.";
    public static final String MESSAGE_SERVICE_CATEGORY_NOT_FOUND = "Không tìm thấy danh mục dịch vụ.";
    public static final String MESSAGE_SERVICE_CATEGORY_NOT_FOUND_BY_ID = "Không tìm thấy danh mục dịch vụ với ID: %s";
    public static final String MESSAGE_SERVICE_CATEGORY_CIRCULAR_REFERENCE = "Không thể đặt danh mục cha là chính nó hoặc danh mục con của nó.";
    public static final String MESSAGE_SERVICE_CATEGORY_SLUG_ALREADY_EXISTS = "Slug '%s' đã tồn tại.";
}
