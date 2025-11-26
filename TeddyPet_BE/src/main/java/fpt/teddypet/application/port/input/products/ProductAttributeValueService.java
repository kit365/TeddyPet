package fpt.teddypet.application.port.input.products;

import fpt.teddypet.application.dto.request.products.attribute.ProductAttributeValueReorderRequest;
import fpt.teddypet.application.dto.response.product.attribute.ProductAttributeValueResponse;
import fpt.teddypet.domain.entity.ProductAttributeValue;
import java.util.List;

public interface ProductAttributeValueService {
    void reorder(ProductAttributeValueReorderRequest request);
    List<ProductAttributeValueResponse> toResponses(List<ProductAttributeValue> attributes);
    List<ProductAttributeValueResponse> toResponses(List<ProductAttributeValue> attributes, boolean isDeleted);
    List<ProductAttributeValueResponse> toResponses(List<ProductAttributeValue> attributes, boolean isDeleted, boolean isActive);

}


