package fpt.teddypet.application.dto.request.services.combo;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record ServiceComboUpsertRequest(
        Long comboId,
        @NotBlank(message = "Mã gói dịch vụ là bắt buộc")
        @Size(max = 50)
        String code,
        @NotBlank(message = "Tên gói dịch vụ là bắt buộc")
        @Size(max = 255)
        String comboName,
        @Size(max = 255)
        String slug,
        String description,
        BigDecimal comboPrice,
        BigDecimal originalPrice,
        LocalDateTime validFrom,
        LocalDateTime validTo,
        @Size(max = 255)
        String imgURL,
        BigDecimal discountPercentage,
        BigDecimal minPetWeight,
        BigDecimal maxPetWeight,
        String suitablePetTypes,
        Integer displayOrder,
        String tags,
        Boolean isPopular,
        Boolean isActive,
        @NotEmpty(message = "Gói dịch vụ phải có ít nhất một dịch vụ")
        @Valid
        List<ServiceComboItemRequest> serviceItems
) {
}
