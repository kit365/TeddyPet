package fpt.teddypet.application.mapper.products;


import fpt.teddypet.application.dto.response.product.attribute.ProductAttributeInfo;
import fpt.teddypet.domain.entity.ProductAttribute;
import fpt.teddypet.domain.entity.ProductAttributeValue;
import org.mapstruct.Context;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.NullValuePropertyMappingStrategy;

import fpt.teddypet.application.dto.response.product.attribute.ProductAttributeResponse;
import java.util.List;

@Mapper(componentModel = "spring", 
        nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE,
        uses = {ProductAttributeValueMapper.class})
public interface ProductAttributeMapper {

    @Mapping(target = "values", source = "values")
    ProductAttributeResponse toResponse(ProductAttribute attribute, List<ProductAttributeValue> values);

    @Mapping(target = "valueIds", expression = "java(mapValuesToIds(attribute.getValues(), context))")
    @Mapping(source = "deleted", target = "isDeleted")
    @Mapping(source = "active", target = "isActive")
    ProductAttributeInfo toInfo(ProductAttribute attribute, @Context MappingContext context);


    default List<Long> mapValuesToIds(List<ProductAttributeValue> values, MappingContext context) {
        if (values == null) return List.of();
        return values.stream()
                .filter(val -> context.includeDeleted() || !val.isDeleted())
                .filter(val -> !context.onlyActive() || val.isActive())
                .sorted(java.util.Comparator.comparing(ProductAttributeValue::getDisplayOrder, java.util.Comparator.nullsLast(Integer::compareTo)))
                .map(ProductAttributeValue::getValueId)
                .toList();
    }

    record MappingContext(boolean includeDeleted, boolean onlyActive) {}
}
