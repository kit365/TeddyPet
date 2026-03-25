package fpt.teddypet.application.dto.response.product.category;

import fpt.teddypet.domain.enums.PetTypeEnum;
import fpt.teddypet.domain.enums.ProductCategoryTypeEnum;

import java.util.List;

public record ProductCategoryHomeResponse(
        Long id,
        String name,
        String slug,
        ProductCategoryTypeEnum categoryType,
        List<PetTypeEnum> suitablePetTypes,
        Long productCount) {
}
