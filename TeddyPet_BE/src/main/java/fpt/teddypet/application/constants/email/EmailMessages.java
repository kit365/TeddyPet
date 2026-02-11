package fpt.teddypet.application.constants.email;

public final class EmailMessages {

    private EmailMessages() {
    }

    // Email Subjects
    public static final String SUBJECT_ORDER_RECEIVED = "[%s] Tiếp nhận đơn hàng #%s";
    public static final String SUBJECT_ORDER_CONFIRMED = "[%s] Xác nhận đơn hàng #%s";
    public static final String SUBJECT_ORDER_PREPARING = "[%s] Đang chuẩn bị đơn hàng #%s";
    public static final String SUBJECT_ORDER_DELIVERING = "[%s] Đơn hàng #%s đang được giao";
    public static final String SUBJECT_ORDER_DELIVERED = "[%s] Đơn hàng #%s đã giao thành công";
    public static final String SUBJECT_ORDER_CANCELLED = "[%s] Thông báo hủy đơn hàng #%s";
    public static final String SUBJECT_ORDER_RETURNED = "[%s] Thông báo hoàn trả đơn hàng #%s";
    public static final String SUBJECT_PASSWORD_RESET = "[%s] Yêu cầu đặt lại mật khẩu";
    public static final String SUBJECT_ACCOUNT_VERIFICATION = "[%s] Xác thực tài khoản của bạn";
    public static final String SUBJECT_GUEST_OTP = "[%s] Mã xác thực đơn hàng của bạn";
    public static final String SUBJECT_SECURITY_OTP = "[%s] Mã xác thực bảo mật tài khoản";
    public static final String SUBJECT_BOOKING_CONFIRMATION = "%s - Xác nhận đặt lịch";
    public static final String SUBJECT_ORDER_CONFIRMATION = "%s - Xác nhận đơn hàng";
    public static final String SUBJECT_ORDER_STATUS_UPDATE = "%s - Cập nhật trạng thái đơn hàng #%s";

    // Email Headlines
    public static final String HEADLINE_ORDER_RECEIVED = "Đặt hàng thành công!";
    public static final String HEADLINE_ORDER_CONFIRMED = "Xác nhận đơn hàng thành công!";
    public static final String HEADLINE_ORDER_PREPARING = "Đang chuẩn bị hàng!";
    public static final String HEADLINE_ORDER_DELIVERING = "Đơn hàng đang trên đường đến!";
    public static final String HEADLINE_ORDER_DELIVERED = "Giao hàng thành công!";
    public static final String HEADLINE_ORDER_CANCELLED = "Đơn hàng đã bị hủy";
    public static final String HEADLINE_ORDER_COMPLETED = "Đơn hàng đã hoàn thành!";
    public static final String HEADLINE_ORDER_RETURNED = "Đơn hàng đã hoàn trả";

    // Email Sub-headlines
    public static final String SUB_HEADLINE_ORDER_RECEIVED = "Đơn hàng của bạn đã được tiếp nhận. Chúng tôi sẽ sớm liên hệ để xác nhận giá vận chuyển.";
    public static final String SUB_HEADLINE_ORDER_CONFIRMED = "Đơn hàng đã được xác nhận và đang chuyển sang giai đoạn chuẩn bị hàng. Cảm ơn bạn đã tin tưởng TeddyPet.";
    public static final String SUB_HEADLINE_ORDER_PREPARING = "TeddyPet đang kiểm tra và đóng gói các sản phẩm trong đơn hàng của bạn để đảm bảo chất lượng tốt nhất khi đến tay.";
    public static final String SUB_HEADLINE_ORDER_DELIVERING = "TeddyPet đã bàn giao đơn hàng cho đơn vị vận chuyển. Bạn hãy chuẩn bị điện thoại để nhận hàng nhé!";
    public static final String SUB_HEADLINE_ORDER_DELIVERED = "Đơn hàng đã được giao đến bạn. Hy vọng bạn và bé cưng sẽ hài lòng với sản phẩm từ TeddyPet!";
    public static final String SUB_HEADLINE_ORDER_CANCELLED = "Rất tiếc, đơn hàng của bạn đã bị hủy. Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ với chúng tôi.";
    public static final String SUB_HEADLINE_ORDER_COMPLETED = "Đơn hàng của bạn đã hoàn thành xuất sắc. Cảm ơn bạn đã đồng hành cùng TeddyPet!";
    public static final String SUB_HEADLINE_ORDER_RETURNED = "Đơn hàng của bạn đã được ghi nhận hoàn trả về hệ thống. Chúng tôi rất tiếc về sự bất tiện này!";

    // Status Texts (Friendly)
    public static final String STATUS_TEXT_RECEIVED = "Đã tiếp nhận";
    public static final String STATUS_TEXT_CONFIRMED = "Đã xác nhận";
    public static final String STATUS_TEXT_PREPARING = "Đang xử lý";
    public static final String STATUS_TEXT_DELIVERING = "Đang giao hàng";
    public static final String STATUS_TEXT_DELIVERED = "Đã giao hàng";
    public static final String STATUS_TEXT_CANCELLED = "Đã hủy";
    public static final String STATUS_TEXT_COMPLETED = "Hoàn thành";
    public static final String STATUS_TEXT_RETURNED = "Đã hoàn trả";

    // Context Variable Names
    public static final String VAR_APP_NAME = "appName";
    public static final String VAR_WEB_URL = "webUrl";
    public static final String VAR_ORDER_CODE = "orderCode";
    public static final String VAR_ORDER_DATE = "orderDate";
    public static final String VAR_PAYMENT_STATUS = "paymentStatus";
    public static final String VAR_FULL_NAME = "fullName";
    public static final String VAR_ITEMS = "items";
    public static final String VAR_ITEM_COUNT = "itemCount";
    public static final String VAR_OTP = "otp";
    public static final String VAR_RESET_LINK = "resetLink";
    public static final String VAR_VERIFY_LINK = "verifyLink";
    public static final String VAR_SUBTOTAL = "subtotal";
    public static final String VAR_SHIPPING_FEE = "shippingFee";
    public static final String VAR_SHIPPING_METHOD = "shippingMethod";
    public static final String VAR_DISCOUNT = "discount";
    public static final String VAR_TOTAL = "total";
    public static final String VAR_PHONE_NUMBER = "phoneNumber";
    public static final String VAR_ADDRESS = "address";
    public static final String VAR_NOTES = "notes";
    public static final String VAR_PAYMENT_METHOD = "paymentMethod";
    public static final String VAR_TRACK_ORDER_URL = "trackOrderUrl";
    public static final String VAR_CUSTOMER_NAME = "customerName";
    public static final String VAR_CUSTOMER_EMAIL = "customerEmail";
    public static final String VAR_SHIPPING_EMAIL = "shippingEmail";
    public static final String VAR_EMAIL_HEADLINE = "emailHeadline";
    public static final String VAR_SUB_HEADLINE = "subHeadline";
    public static final String VAR_ORDER_STATUS = "orderStatus";
    public static final String VAR_ORDER_STATUS_TEXT = "orderStatusText";
    public static final String VAR_HOTLINE = "hotline";
    public static final String VAR_FACEBOOK_URL = "facebookUrl";
    public static final String VAR_INSTAGRAM_URL = "instagramUrl";

    // Social Media Links
    public static final String VALUE_FACEBOOK_URL = "https://facebook.com/teddypet";
    public static final String VALUE_INSTAGRAM_URL = "https://instagram.com/teddypet";

    // Display Labels
    public static final String LABEL_PAYMENT_PENDING = "Chờ thanh toán";
    public static final String LABEL_PAYMENT_SUCCESS = "Thanh toán thành công";
    public static final String LABEL_PAYMENT_COD = "Thanh toán khi nhận hàng";
    public static final String LABEL_SHIPPING_DEFAULT = "Giao hàng tận nơi";
    public static final String LABEL_METHOD_COD = "Tiền mặt (COD)";
    public static final String LABEL_METHOD_ONLINE = "Thanh toán online";
    public static final String LABEL_NOT_AVAILABLE = "N/A";
}
