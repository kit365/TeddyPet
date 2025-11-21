package fpt.teddypet.application.port.input;

import fpt.teddypet.application.dto.request.product.attribute.ProductAttributeRequest;
import fpt.teddypet.application.dto.response.product.attribute.ProductAttributeInfo;
import fpt.teddypet.application.dto.response.product.attribute.ProductAttributeResponse;
import fpt.teddypet.domain.entity.ProductAttribute;
import fpt.teddypet.domain.enums.UnitEnum;

import java.util.List;

public interface ProductAttributeService {
    ProductAttributeResponse create(ProductAttributeRequest request);
    ProductAttributeResponse update(Long attributeId, ProductAttributeRequest request);
    ProductAttributeResponse getById(Long attributeId);
    List<ProductAttributeResponse> getAll();
    void delete(Long attributeId);
    List<ProductAttribute> getAllByIdsAndActiveAndDeleted(List<Long> ids, boolean active, boolean deleted);
    List<UnitEnum> getSupportedUnits(Long attributeId);

    ProductAttributeResponse toResponse(ProductAttribute attribute);
    ProductAttributeResponse toResponse(ProductAttribute attribute, boolean isDeleted);
    ProductAttributeInfo toInfo(ProductAttribute attribute);
    ProductAttributeInfo toInfo(ProductAttribute attribute, boolean includeDeleted);
    ProductAttributeInfo toInfo(ProductAttribute attribute, boolean includeDeleted, boolean onlyActive);

    List<ProductAttributeInfo> toInfos(List<ProductAttribute> attributes);
    List<ProductAttributeInfo> toInfos(List<ProductAttribute> attributes, boolean includeDeleted);
    List<ProductAttributeInfo> toInfos(List<ProductAttribute> attributes, boolean includeDeleted, boolean onlyActive);
}
