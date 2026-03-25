package fpt.teddypet.application.dto.request.services.pricing;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ServicePricingUpsertRequest(
        Long pricingId,
        @NotNull(message = "ID dịch vụ là bắt buộc")
        Long serviceId,
        String suitablePetTypes,
        @NotBlank(message = "Tên quy tắc giá là bắt buộc")
        @Size(max = 255)
        String pricingName,
        @NotNull(message = "Giá là bắt buộc")
        @DecimalMin("0")
        BigDecimal price,
        BigDecimal weekendMultiplier,
        BigDecimal peakSeasonMultiplier,
        BigDecimal holidayMultiplier,
        BigDecimal minWeight,
        BigDecimal maxWeight,
        LocalDateTime effectiveFrom,
        LocalDateTime effectiveTo,
        @NotNull
        Integer priority,
        Boolean isActive,
        /** Loại phòng (chỉ dùng khi service.isRequiredRoom=true) */
        Long roomTypeId
) {
}
