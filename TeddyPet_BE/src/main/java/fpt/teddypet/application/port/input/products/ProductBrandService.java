package fpt.teddypet.application.port.input.products;

import fpt.teddypet.application.dto.request.products.brand.ProductBrandRequest;
import fpt.teddypet.application.dto.response.product.brand.ProductBrandResponse;
import fpt.teddypet.application.dto.response.product.brand.ProductBrandInfo;
import fpt.teddypet.domain.entity.ProductBrand;

import java.util.List;

public interface ProductBrandService {
    ProductBrandResponse create(ProductBrandRequest request);
    ProductBrandResponse update(Long brandId, ProductBrandRequest request);
    ProductBrandResponse getByIdResponse(Long brandId);
    ProductBrand getById(Long brandId);
    ProductBrand getByIdAndStatusAndDeleted(Long brandId, boolean isActive, boolean isDeleted);
    ProductBrand getReferenceById(Long brandId);
    List<ProductBrandResponse> getAll();
    void delete(Long brandId);

    ProductBrandInfo toInfo(ProductBrand brand);
    ProductBrandInfo toInfo(ProductBrand brand, boolean isDeleted);
    ProductBrandInfo toInfo(ProductBrand brand, boolean isDeleted, boolean isActive);

}

