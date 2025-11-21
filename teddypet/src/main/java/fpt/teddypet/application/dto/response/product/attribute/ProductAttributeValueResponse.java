package fpt.teddypet.application.dto.response.product.attribute;

public record ProductAttributeValueResponse(
        Long valueId,
        Long attributeId,
        String attributeName,
        String value,
        Integer displayOrder,
        boolean isDeleted,
        boolean isActive
) {
}


