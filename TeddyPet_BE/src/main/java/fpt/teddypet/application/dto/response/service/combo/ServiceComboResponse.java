package fpt.teddypet.application.dto.response.service.combo;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record ServiceComboResponse(
        Long comboId,
        String code,
        String comboName,
        String description,
        BigDecimal comboPrice,
        BigDecimal originalPrice,
        LocalDateTime validFrom,
        LocalDateTime validTo,
        String imgURL,
        BigDecimal discountPercentage,
        BigDecimal minPetWeight,
        BigDecimal maxPetWeight,
        String applicablePetTypes,
        Integer displayOrder,
        String tags,
        Boolean isPopular,
        @JsonProperty("isActive")
        boolean isActive,
        boolean isDeleted,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        String createdBy,
        String updatedBy,
        List<ServiceComboItemResponse> serviceItems
) {
}
