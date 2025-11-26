package fpt.teddypet.application.constants.orders.cart;

public final class CartLogMessages {

    private CartLogMessages() {
        // Utility class - prevent instantiation
    }

    // Get cart log messages
    public static final String LOG_CART_GET_START = "[CartService] Bắt đầu lấy giỏ hàng cho user ID: {}";
    public static final String LOG_CART_GET_SUCCESS = "[CartService] Lấy giỏ hàng thành công, số lượng items: {}";
    public static final String LOG_CART_GET_CREATED_NEW = "[CartService] Tạo giỏ hàng mới cho user ID: {}";

    // Add item log messages
    public static final String LOG_CART_ADD_START = "[CartService] Bắt đầu thêm variant ID {} vào giỏ hàng, số lượng: {}";
    public static final String LOG_CART_ADD_SUCCESS = "[CartService] Thêm sản phẩm vào giỏ thành công, variant ID: {}";
    public static final String LOG_CART_ADD_MERGED = "[CartService] Merge số lượng cho variant ID {}, số lượng mới: {}";

    // Update item log messages
    public static final String LOG_CART_UPDATE_START = "[CartService] Bắt đầu cập nhật số lượng cho variant ID: {}";
    public static final String LOG_CART_UPDATE_SUCCESS = "[CartService] Cập nhật số lượng thành công, variant ID: {}, số lượng mới: {}";

    // Remove item log messages
    public static final String LOG_CART_REMOVE_START = "[CartService] Bắt đầu xóa variant ID {} khỏi giỏ hàng";
    public static final String LOG_CART_REMOVE_SUCCESS = "[CartService] Xóa sản phẩm khỏi giỏ thành công, variant ID: {}";
    public static final String LOG_CART_REMOVE_NOT_FOUND = "[CartService] Không tìm thấy variant ID {} trong giỏ hàng";

    // Clear cart log messages
    public static final String LOG_CART_CLEAR_START = "[CartService] Bắt đầu xóa toàn bộ giỏ hàng cho user ID: {}";
    public static final String LOG_CART_CLEAR_SUCCESS = "[CartService] Xóa giỏ hàng thành công";

    // Validation log messages
    public static final String LOG_CART_VALIDATE_VARIANT = "[CartService] Validate variant ID: {}";
    public static final String LOG_CART_VALIDATE_STOCK = "[CartService] Kiểm tra tồn kho cho variant ID: {}, stock: {}, requested: {}";
    public static final String LOG_CART_VALIDATE_FAILED = "[CartService] Validation thất bại: {}";
    public static final String LOG_CART_VARIANT_LOAD_FAILED = "[CartService] Failed to load variant {}: {}";
}
