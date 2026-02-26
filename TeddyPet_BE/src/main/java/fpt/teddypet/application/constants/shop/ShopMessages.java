package fpt.teddypet.application.constants.shop;

public final class ShopMessages {

    private ShopMessages() {
    }

    public static final String MESSAGE_TIME_SLOT_EXCEPTION_CREATED = "Tạo ngoại lệ thành công";
    public static final String MESSAGE_TIME_SLOT_EXCEPTION_UPDATED = "Cập nhật ngoại lệ thành công";
    public static final String MESSAGE_TIME_SLOT_EXCEPTION_DELETED = "Xóa ngoại lệ thành công";
    public static final String MESSAGE_TIME_SLOT_EXCEPTION_NOT_FOUND = "Không tìm thấy ngoại lệ với id: %d";

    public static final String MESSAGE_TIME_SLOT_CREATED = "Thêm khung giờ thành công";
    public static final String MESSAGE_TIME_SLOT_UPDATED = "Cập nhật khung giờ thành công";
    public static final String MESSAGE_TIME_SLOT_DELETED = "Xóa khung giờ thành công";
    public static final String MESSAGE_TIME_SLOT_NOT_FOUND = "Không tìm thấy khung giờ với id: %d";
    public static final String MESSAGE_TIME_SLOT_INVALID_RANGE = "Giờ bắt đầu vòng đời phải sớm hơn giờ kết thúc";
    public static final String MESSAGE_TIME_SLOT_OVERLAP = "Khung giờ bị trùng lặp với khung giờ hiện tại (%s - %s)";
    public static final String MESSAGE_TIME_SLOT_OUT_OF_SHOP_HOURS = "Khung giờ không hợp lệ: %s %s chỉ hoạt động từ %s đến %s";
    public static final String MESSAGE_TIME_SLOT_IN_BREAK = "Khung giờ bị trùng với giờ nghỉ (%s - %s) của %s %s";

    public static final String MESSAGE_OPERATION_HOUR_UPDATED = "Cập nhật giờ hoạt động thành công";
    public static final String MESSAGE_OPERATION_HOUR_DAY_EXISTS = "Đã tồn tại cấu hình cho thứ %d";
}
