package fpt.teddypet.application.mapper;
import fpt.teddypet.application.dto.response.product.attribute.ProductAttributeValueResponse;
import fpt.teddypet.domain.entity.ProductAttributeValue;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;


@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = org.mapstruct.NullValuePropertyMappingStrategy.IGNORE, unmappedTargetPolicy = org.mapstruct.ReportingPolicy.IGNORE)
public interface ProductAttributeValueMapper {

    @Mapping(source = "attribute.attributeId", target = "attributeId")
    @Mapping(source = "attribute.name", target = "attributeName")
    @Mapping(source = "deleted", target = "isDeleted")
    @Mapping(source = "active", target = "isActive")
    ProductAttributeValueResponse toResponse(ProductAttributeValue productAttributeValue);

    List<ProductAttributeValueResponse> toResponse(List<ProductAttributeValue> productAttributeValues);

    default Long toId(ProductAttributeValue entity) {
        if (entity == null) {
            return null;
        }
        return entity.getValueId();
    }
}
