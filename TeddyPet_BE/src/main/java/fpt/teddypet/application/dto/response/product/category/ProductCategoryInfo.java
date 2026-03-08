package fpt.teddypet.application.dto.response.product.category;

import fpt.teddypet.domain.enums.PetTypeEnum;
import fpt.teddypet.domain.enums.ProductCategoryTypeEnum;

import java.util.List;

public record ProductCategoryInfo(
        Long id,
        String name,
        Long parentId,
        ProductCategoryTypeEnum categoryType,
        List<PetTypeEnum> suitablePetTypes,
        boolean isDeleted,
        boolean isActive
) {
}

