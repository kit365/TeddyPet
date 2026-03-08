package fpt.teddypet.application.service.orders;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * Cấu hình cột Excel cho Import/Export Đơn hàng.
 */
@Getter
@RequiredArgsConstructor
public enum OrderExcelColumn {
    ORDER_CODE(0, "Mã đơn hàng *", false),
    ORDER_TYPE(1, "Loại đơn (ONLINE/OFFLINE)", false),
    STATUS(2, "Trạng thái", false),
    CUSTOMER_NAME(3, "Tên khách hàng", false),
    CUSTOMER_EMAIL(4, "Email khách", false),
    SHIPPING_PHONE(5, "SĐT giao hàng", false),
    SHIPPING_NAME(6, "Tên người nhận", false),
    SHIPPING_ADDRESS(7, "Địa chỉ giao hàng", false),
    VOUCHER_CODE(8, "Mã giảm giá", false),
    NOTES(9, "Ghi chú", false),

    // Items
    PRODUCT_NAME(10, "Tên sản phẩm *", false),
    VARIANT_NAME(11, "Tên biến thể", false),
    QUANTITY(12, "Số lượng *", false),
    UNIT_PRICE(13, "Đơn giá *", false),

    // Totals
    SHIPPING_FEE(14, "Phí vận chuyển", false),
    DISCOUNT_AMOUNT(15, "Giảm giá thêm", false),

    // Payment
    PAYMENT_METHOD(16, "Phương thức TT", false),
    PAYMENT_STATUS(17, "Trạng thái TT", false),

    // Dates
    CREATED_AT(18, "Ngày tạo (dd/MM/yyyy HH:mm:ss)", false);

    private final int index;
    private final String header;
    private final boolean readOnly;

    public static int totalColumns() {
        return values().length;
    }
}
