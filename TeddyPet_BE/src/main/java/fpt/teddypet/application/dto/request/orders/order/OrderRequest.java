package fpt.teddypet.application.dto.request.orders.order;

import fpt.teddypet.domain.enums.payments.PaymentMethodEnum;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.List;

public record OrderRequest(
        @NotNull(message = "Phương thức thanh toán là bắt buộc") PaymentMethodEnum paymentMethod,

        // Optional: nếu có thì lấy từ địa chỉ đã lưu, không cần nhập thủ công
        Long userAddressId,

        // Các field này chỉ bắt buộc khi userAddressId = null hoặc guest checkout
        @Size(max = 100, message = "Tên người nhận tối đa 100 ký tự") String receiverName,

        @Pattern(regexp = "^(0|\\+84)[\\s.]?((3[2-9])|(5[689])|(7[06-9])|(8[1-689])|(9[0-46-9]))(\\d)[\\s.]?(\\d{3})[\\s.]?(\\d{3})$", message = "Số điện thoại không đúng định dạng Việt Nam") String receiverPhone,

        @Size(max = 500, message = "Địa chỉ quá dài (tối đa 500 ký tự)") String shippingAddress,

        @Size(max = 1000, message = "Ghi chú tối đa 1000 ký tự") String note,

        @NotEmpty(message = "Đơn hàng phải có ít nhất 1 sản phẩm") @Valid List<OrderItemRequest> items,

        @Size(max = 50, message = "Mã giảm giá tối đa 50 ký tự") String voucherCode,

        // Email cho guest checkout - bắt buộc khi không đăng nhập
        @Email(message = "Email không đúng định dạng") @Size(max = 255, message = "Email tối đa 255 ký tự") String guestEmail,

        // OTP Code cho guest xác thực email
        String otpCode,

        Double latitude,
        Double longitude

) {
}
