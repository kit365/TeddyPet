package fpt.teddypet.application.constants.auth;

public final class StaffPasswordReissueMessages {

    private StaffPasswordReissueMessages() {
    }

    public static final String MESSAGE_REQUEST_SUCCESS =
            "Yêu cầu đã được gửi. Quản trị viên sẽ xử lý và bạn sẽ nhận mật khẩu qua email sau khi được duyệt.";

    public static final String MESSAGE_REQUEST_ALREADY_PENDING =
            "Bạn đã có yêu cầu cấp lại mật khẩu đang chờ xử lý. Vui lòng liên hệ quản trị viên nếu cần gấp.";

    public static final String MESSAGE_STAFF_ONLY =
            "Chỉ tài khoản nhân viên mới được dùng tính năng này.";

    public static final String MESSAGE_USER_NOT_FOUND = "Không tìm thấy người dùng với email hoặc tên đăng nhập đã nhập.";

    public static final String MESSAGE_EMAIL_NOT_VERIFIED =
            "Tài khoản chưa được xác thực email. Không thể gửi yêu cầu cấp lại mật khẩu.";

    public static final String MESSAGE_USER_NOT_ACTIVE =
            "Tài khoản không ở trạng thái hoạt động. Vui lòng liên hệ quản trị viên.";

    public static final String MESSAGE_TOKEN_INVALID_OR_EXPIRED =
            "Liên kết không hợp lệ hoặc đã hết hạn.";

    public static final String MESSAGE_CONFIRM_SUCCESS =
            "Đã cấp mật khẩu tạm cho nhân viên. Mật khẩu đã được gửi qua email của nhân viên.";

    public static final String MESSAGE_PREVIEW_FAILED = "Không tải được thông tin yêu cầu.";
}
