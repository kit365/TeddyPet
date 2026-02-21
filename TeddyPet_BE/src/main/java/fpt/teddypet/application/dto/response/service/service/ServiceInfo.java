package fpt.teddypet.application.dto.response.service.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import fpt.teddypet.domain.enums.PetTypeEnum;

import java.math.BigDecimal;
import java.util.List;

public record ServiceInfo(
        Long serviceId,
        String code,
        String serviceName,
        String shortDescription,
        List<PetTypeEnum> suitablePetTypes,
        String priceUnit,
        Integer duration,
        BigDecimal basePrice,
        String imageURL,
        @JsonProperty("isActive")
        boolean isActive
) {
}
