package fpt.teddypet.application.constants.room;

public final class RoomMessages {

    private RoomMessages() {
    }

    public static final String MESSAGE_ROOM_CREATED_SUCCESS = "Tạo phòng thành công.";
    public static final String MESSAGE_ROOM_UPDATED_SUCCESS = "Cập nhật phòng thành công.";
    public static final String MESSAGE_ROOM_DELETED_SUCCESS = "Xóa phòng thành công.";
    public static final String MESSAGE_ROOM_NOT_FOUND_BY_ID = "Không tìm thấy phòng với ID: %s";
    public static final String MESSAGE_ROOM_NUMBER_ALREADY_EXISTS = "Mã phòng '%s' đã tồn tại trong loại phòng này.";
    public static final String MESSAGE_ROOM_NUMBER_DUPLICATE = "Tên phòng này đã tồn tại, vui lòng nhập tên khác!";
    public static final String MESSAGE_ROOM_POSITION_OCCUPIED = "Vị trí (Block %s, Hàng %d, Cột %d, Ngăn %s) đã có phòng khác. Không thể đặt hai phòng trùng vị trí.";
    public static final String MESSAGE_ROOM_BLOCKING_CREATED_SUCCESS = "Khóa phòng thành công. Trạng thái phòng đã được đặt là BLOCKED.";
}
