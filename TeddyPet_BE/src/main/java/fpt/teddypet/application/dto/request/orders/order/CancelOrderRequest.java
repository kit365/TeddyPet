package fpt.teddypet.application.dto.request.orders.order;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CancelOrderRequest(
        @NotBlank(message = "Lý do hủy không được để trống") @Size(min = 5, max = 500, message = "Lý do hủy phải từ 5 đến 500 ký tự") String reason) {
}
