package fpt.teddypet.application.constants.orders.cart;

public final class CartMessages {

    private CartMessages() {
        // Utility class - prevent instantiation
    }

    // Error messages
    public static final String MESSAGE_CART_NOT_FOUND = "Không tìm thấy giỏ hàng.";
    public static final String MESSAGE_CART_ITEM_NOT_FOUND = "Không tìm thấy sản phẩm trong giỏ hàng.";
    public static final String MESSAGE_CART_INVALID_QUANTITY = "Số lượng không hợp lệ. Số lượng phải lớn hơn 0.";
    public static final String MESSAGE_CART_PRODUCT_NOT_AVAILABLE = "Sản phẩm không còn khả dụng.";
    public static final String MESSAGE_CART_OUT_OF_STOCK = "Sản phẩm hiện đã hết hàng.";
    public static final String MESSAGE_CART_INSUFFICIENT_STOCK = "Không đủ hàng. Còn lại: %d.";
    public static final String MESSAGE_CART_VARIANT_NOT_FOUND = "Không tìm thấy biến thể sản phẩm với ID: %d";

    // Success messages
    public static final String MESSAGE_CART_ADD_SUCCESS = "Thêm sản phẩm vào giỏ hàng thành công.";
    public static final String MESSAGE_CART_UPDATE_SUCCESS = "Cập nhật giỏ hàng thành công.";
    public static final String MESSAGE_CART_REMOVE_SUCCESS = "Xóa sản phẩm khỏi giỏ hàng thành công.";
    public static final String MESSAGE_CART_CLEAR_SUCCESS = "Xóa toàn bộ giỏ hàng thành công.";
}
