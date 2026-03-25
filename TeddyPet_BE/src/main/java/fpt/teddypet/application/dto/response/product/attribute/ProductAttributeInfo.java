package fpt.teddypet.application.dto.response.product.attribute;
import fpt.teddypet.domain.enums.AttributeDisplayType;
import fpt.teddypet.domain.enums.UnitEnum;
import java.util.List;

public record ProductAttributeInfo(
        Long attributeId,
        String name,
        List<Long> valueIds,
        Integer displayOrder,
        AttributeDisplayType displayType,
        boolean isDeleted,
        boolean isActive,
        List<UnitEnum> supportedUnits

) {
}
