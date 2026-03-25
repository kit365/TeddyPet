package fpt.teddypet.application.dto.response.service.category;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record ServiceCategoryNestedResponse(
        Long categoryId,
        String categoryName,
        String slug,
        String icon,
        String imageUrl,
        String colorCode,
        Integer displayOrder,
        @JsonProperty("isActive")
        boolean isActive,
        List<ServiceCategoryNestedResponse> children
) {
}
