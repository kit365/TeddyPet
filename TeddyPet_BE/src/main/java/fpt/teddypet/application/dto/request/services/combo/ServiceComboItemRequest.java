package fpt.teddypet.application.dto.request.services.combo;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record ServiceComboItemRequest(
        @NotNull(message = "ID dịch vụ là bắt buộc")
        Long serviceId,
        @NotNull(message = "Số lượng là bắt buộc")
        @Min(value = 1, message = "Số lượng phải lớn hơn hoặc bằng 1")
        Integer quantity
) {
}
