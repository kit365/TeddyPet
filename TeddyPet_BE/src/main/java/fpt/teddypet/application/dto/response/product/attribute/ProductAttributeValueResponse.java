package fpt.teddypet.application.dto.response.product.attribute;
import fpt.teddypet.domain.enums.UnitEnum;

import java.math.BigDecimal;

public record ProductAttributeValueResponse(
        Long valueId,
        Long attributeId,
        String attributeName,
        String value,
        Integer displayOrder,
        String displayCode,
        boolean isDeleted,
        boolean isActive,
        BigDecimal amount,
        UnitEnum unit
) {
}


