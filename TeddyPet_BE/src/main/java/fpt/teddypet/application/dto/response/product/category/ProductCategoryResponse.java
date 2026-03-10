package fpt.teddypet.application.dto.response.product.category;

import fpt.teddypet.domain.enums.PetTypeEnum;
import fpt.teddypet.domain.enums.ProductCategoryTypeEnum;

import java.time.LocalDateTime;
import java.util.List;

public record ProductCategoryResponse(
        Long categoryId,
        String name,
        String slug,
        String description,
        String imageUrl,
        String altImage,
        Long parentId,
        String parentName,
        ProductCategoryTypeEnum categoryType,
        List<PetTypeEnum> suitablePetTypes,
        boolean isActive,
        boolean isDeleted,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        String createdBy,
        String updatedBy) {
}
