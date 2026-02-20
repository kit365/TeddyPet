package fpt.teddypet.application.dto.response.service.category;

import com.fasterxml.jackson.annotation.JsonProperty;

public record ServiceCategoryInfo(
        Long categoryId,
        String categoryName,
        String slug,
        String icon,
        String imageUrl,
        String colorCode,
        Integer displayOrder,
        @JsonProperty("isActive")
        boolean isActive
) {
}
