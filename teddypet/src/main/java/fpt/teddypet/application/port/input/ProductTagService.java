package fpt.teddypet.application.port.input;

import fpt.teddypet.application.dto.request.ProductTagRequest;
import fpt.teddypet.application.dto.response.product.tag.ProductTagResponse;
import fpt.teddypet.application.dto.response.product.tag.ProductTagInfo;
import fpt.teddypet.domain.entity.ProductTag;

import java.util.List;

public interface ProductTagService {
    ProductTagResponse create(ProductTagRequest request);
    ProductTagResponse update(Long tagId, ProductTagRequest request);
    ProductTagResponse getByIdResponse(Long tagId);
    ProductTag getById(Long tagId);
    List<ProductTagResponse> getAll();
    ProductTagInfo toInfo(ProductTag tag);
    ProductTagInfo toInfo(ProductTag tag, boolean includeDeleted);
    ProductTagInfo toInfo(ProductTag tag, boolean includeDeleted, boolean onlyActive);

    List<ProductTagInfo> toInfos(List<ProductTag> tags);
    List<ProductTagInfo> toInfos(List<ProductTag> tags, boolean includeDeleted);
    List<ProductTagInfo> toInfos(List<ProductTag> tags, boolean includeDeleted, boolean onlyActive);
    void delete(Long tagId);
}

