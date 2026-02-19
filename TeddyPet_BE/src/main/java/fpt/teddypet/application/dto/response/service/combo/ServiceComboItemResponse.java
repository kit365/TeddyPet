package fpt.teddypet.application.dto.response.service.combo;

import com.fasterxml.jackson.annotation.JsonProperty;

public record ServiceComboItemResponse(
        Long serviceId,
        String serviceCode,
        String serviceName,
        Integer quantity,
        @JsonProperty("isActive")
        boolean serviceActive
) {
}
