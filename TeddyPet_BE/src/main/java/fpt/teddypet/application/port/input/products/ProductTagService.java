package fpt.teddypet.application.port.input.products;

import fpt.teddypet.application.dto.request.products.tag.ProductTagRequest;
import fpt.teddypet.application.dto.response.product.tag.ProductTagResponse;
import fpt.teddypet.application.dto.response.product.tag.ProductTagInfo;
import fpt.teddypet.domain.entity.ProductTag;

import java.util.List;

public interface ProductTagService {
    void create(ProductTagRequest request);

    void update(Long tagId, ProductTagRequest request);

    ProductTagResponse getByIdResponse(Long tagId);

    ProductTag getById(Long tagId);

    List<ProductTagResponse> getAll();

    ProductTagInfo toInfo(ProductTag tag);

    ProductTagInfo toInfo(ProductTag tag, boolean includeDeleted);

    ProductTagInfo toInfo(ProductTag tag, boolean includeDeleted, boolean onlyActive);

    List<ProductTag> getAllByIdsAndActiveAndDeleted(List<Long> tagIds, boolean isActive, boolean isDeleted);

    List<ProductTagInfo> toInfos(List<ProductTag> tags);

    List<ProductTagInfo> toInfos(List<ProductTag> tags, boolean includeDeleted);

    List<ProductTagInfo> toInfos(List<ProductTag> tags, boolean includeDeleted, boolean onlyActive);

    void delete(Long tagId);

    int deleteMany(List<Long> ids);

    List<fpt.teddypet.application.dto.response.product.tag.ProductTagHomeResponse> getAllHomeTags();
}
