package fpt.teddypet.application.dto.request.orders.order;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record ReturnOrderRequest(
                @NotBlank(message = "Lý do hoàn trả không được để trống") @Size(min = 5, max = 500, message = "Lý do hoàn trả phải từ 5 đến 500 ký tự") String reason,
                List<String> evidenceUrls) {
}
