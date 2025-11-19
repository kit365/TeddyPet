package fpt.teddypet.application.port.input;

import fpt.teddypet.application.dto.request.ProductBrandRequest;
import fpt.teddypet.application.dto.response.ProductBrandResponse;
import fpt.teddypet.domain.entity.ProductBrand;

import java.util.List;

public interface ProductBrandService {
    ProductBrandResponse create(ProductBrandRequest request);
    ProductBrandResponse update(Long brandId, ProductBrandRequest request);
    ProductBrandResponse getByIdResponse(Long brandId);
    ProductBrand getById(Long brandId);
    List<ProductBrandResponse> getAll();
    void delete(Long brandId);
}

