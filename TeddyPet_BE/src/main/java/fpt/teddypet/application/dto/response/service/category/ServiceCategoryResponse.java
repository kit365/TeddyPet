package fpt.teddypet.application.dto.response.service.category;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;

public record ServiceCategoryResponse(
        Long categoryId,
        String categoryName,
        String slug,
        String description,
        String serviceType,
        String pricingModel,
        String icon,
        String imageUrl,
        String colorCode,
        String metaTitle,
        String metaDescription,
        Long parentId,
        Integer displayOrder,
        @JsonProperty("isActive")
        boolean isActive,
        boolean isDeleted,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        String createdBy,
        String updatedBy
) {
}
