package fpt.teddypet.application.constants.user;

public final class UserLogMessages {

    private UserLogMessages() {
        // Utility class - prevent instantiation
    }

    // Find user log messages
    public static final String LOG_USER_FIND_BY_EMAIL_START = "[UserService] Bắt đầu tìm kiếm user theo email: {}";
    public static final String LOG_USER_FIND_BY_EMAIL_SUCCESS = "[UserService] Tìm thấy user với email: {}";
    public static final String LOG_USER_FIND_BY_EMAIL_NOT_FOUND = "[UserService] Không tìm thấy user với email: {}";
    public static final String LOG_USER_FIND_BY_ID_START = "[UserService] Bắt đầu tìm kiếm user theo ID: {}";
    public static final String LOG_USER_FIND_BY_ID_SUCCESS = "[UserService] Tìm thấy user với ID: {}";
    public static final String LOG_USER_FIND_BY_ID_NOT_FOUND = "[UserService] Không tìm thấy user với ID: {}";

    // Check existence log messages
    public static final String LOG_USER_CHECK_EMAIL_EXISTS = "[UserService] Kiểm tra email đã tồn tại: {}";
    public static final String LOG_USER_EMAIL_EXISTS = "[UserService] Email đã tồn tại: {}";
    public static final String LOG_USER_EMAIL_NOT_EXISTS = "[UserService] Email chưa tồn tại: {}";

    // Save user log messages
    public static final String LOG_USER_SAVE_START = "[UserService] Bắt đầu lưu user: {}";
    public static final String LOG_USER_SAVE_SUCCESS = "[UserService] Lưu user thành công, ID: {}";
    public static final String LOG_USER_SAVE_ERROR = "[UserService] Lỗi khi lưu user: {}";

    // Update user log messages
    public static final String LOG_USER_UPDATE_START = "[UserService] Bắt đầu cập nhật user, ID: {}";
    public static final String LOG_USER_UPDATE_SUCCESS = "[UserService] Cập nhật user thành công, ID: {}";
    public static final String LOG_USER_UPDATE_ERROR = "[UserService] Lỗi khi cập nhật user, ID: {}";

    // Delete user log messages
    public static final String LOG_USER_DELETE_START = "[UserService] Bắt đầu xóa user, ID: {}";
    public static final String LOG_USER_DELETE_SUCCESS = "[UserService] Xóa user thành công, ID: {}";
    public static final String LOG_USER_DELETE_ERROR = "[UserService] Lỗi khi xóa user, ID: {}";
}

