package fpt.teddypet.application.dto.request.orders.order;
import fpt.teddypet.domain.enums.payments.PaymentMethodEnum;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.List;

public record OrderRequest(
        @NotNull(message = "Phương thức thanh toán là bắt buộc")
        PaymentMethodEnum paymentMethod,

        @NotBlank(message = "Tên người nhận không được để trống")
        @Size(max = 100, message = "Tên người nhận tối đa 100 ký tự")
        String receiverName,

        @NotBlank(message = "Số điện thoại người nhận không được để trống")
        @Pattern(regexp = "^(0|\\+84)[\\s.]?((3[2-9])|(5[689])|(7[06-9])|(8[1-689])|(9[0-46-9]))(\\d)[\\s.]?(\\d{3})[\\s.]?(\\d{3})$",
                message = "Số điện thoại không đúng định dạng Việt Nam")
        String receiverPhone,

        @NotBlank(message = "Địa chỉ giao hàng không được để trống")
        @Size(max = 500, message = "Địa chỉ quá dài (tối đa 500 ký tự)")
        String shippingAddress,

        @Size(max = 1000, message = "Ghi chú tối đa 1000 ký tự")
        String note,

        @NotEmpty(message = "Đơn hàng phải có ít nhất 1 sản phẩm")
        @Valid
        List<OrderItemRequest> items,

        @Size(max = 50, message = "Mã giảm giá tối đa 50 ký tự")
        String voucherCode

) {
}
