package fpt.teddypet.application.dto.response.product.attribute;

import fpt.teddypet.domain.enums.AttributeDisplayType;
import fpt.teddypet.domain.enums.UnitEnum;

import java.util.List;

public record ProductAttributeResponse(
        Long attributeId,
        String name,
        AttributeDisplayType displayType,
        Integer displayOrder,
        List<ProductAttributeValueResponse> values,
        List<UnitEnum> supportedUnits

) {
}


