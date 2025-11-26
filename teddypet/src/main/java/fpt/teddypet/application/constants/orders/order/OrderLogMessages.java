package fpt.teddypet.application.constants.orders.order;

public final class OrderLogMessages {

    private OrderLogMessages() {
        // Utility class - prevent instantiation
    }

    // Log messages for create/update
    public static final String LOG_ORDER_CREATE_START = "Bắt đầu tạo đơn hàng cho user ID: {}";
    public static final String LOG_ORDER_CREATE_SUCCESS = "Tạo đơn hàng thành công. Order ID: {}, Code: {}";
    public static final String LOG_ORDER_UPDATE_START = "Bắt đầu cập nhật đơn hàng ID: {}";
    public static final String LOG_ORDER_UPDATE_SUCCESS = "Cập nhật đơn hàng thành công. Order ID: {}";

    // Log messages for get
    public static final String LOG_ORDER_GET_BY_ID = "Lấy đơn hàng theo ID: {}";
    public static final String LOG_ORDER_GET_BY_CODE = "Lấy đơn hàng theo mã: {}";
    public static final String LOG_ORDER_GET_BY_USER = "Lấy danh sách đơn hàng của user ID: {}, số lượng: {}";
    public static final String LOG_ORDER_GET_ALL = "Lấy danh sách tất cả đơn hàng, số lượng: {}";

    // Log messages for status
    public static final String LOG_ORDER_STATUS_UPDATE = "Cập nhật trạng thái đơn hàng ID: {} từ {} sang {}";
    public static final String LOG_ORDER_CANCEL = "Hủy đơn hàng ID: {}";

    // Log messages for security
    public static final String LOG_ORDER_ACCESS_DENIED = "User ID: {} cố gắng truy cập đơn hàng ID: {} không thuộc quyền sở hữu";
    public static final String LOG_ORDER_OWNERSHIP_VERIFIED = "Xác thực quyền sở hữu đơn hàng thành công. User ID: {}, Order ID: {}";
    
    // Log messages for validation
    public static final String LOG_ORDER_VALIDATE_VARIANT = "Đang validate variant ID: {}";
    public static final String LOG_ORDER_VALIDATE_STOCK = "Đang validate stock cho variant ID: {}, stock hiện tại: {}, yêu cầu: {}";
    
    // Log messages for pricing
    public static final String LOG_ORDER_CALCULATE_PRICING = "Tính toán giá đơn hàng - Subtotal: {}, Discount: {}, Shipping: {}, Final Amount: {}";
    
    // Log messages for cart
    public static final String LOG_ORDER_CART_CLEARED = "Đã xóa giỏ hàng sau khi tạo đơn hàng thành công. User ID: {}";
}
