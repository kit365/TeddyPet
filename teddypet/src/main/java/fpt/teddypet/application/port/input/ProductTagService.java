package fpt.teddypet.application.port.input;

import fpt.teddypet.application.dto.request.ProductTagRequest;
import fpt.teddypet.application.dto.response.ProductTagResponse;
import fpt.teddypet.domain.entity.ProductTag;

import java.util.List;

public interface ProductTagService {
    ProductTagResponse create(ProductTagRequest request);
    ProductTagResponse update(Long tagId, ProductTagRequest request);
    ProductTagResponse getByIdResponse(Long tagId);
    ProductTag getById(Long tagId);
    List<ProductTagResponse> getAll();
    void delete(Long tagId);
}

