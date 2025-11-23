package fpt.teddypet.infrastructure.adapter.products;

import fpt.teddypet.application.constants.products.productbrand.ProductBrandMessages;
import fpt.teddypet.application.port.output.products.ProductBrandRepositoryPort;
import fpt.teddypet.domain.entity.ProductBrand;
import fpt.teddypet.infrastructure.persistence.postgres.repository.ProductBrandRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import java.util.List;

@Component
@RequiredArgsConstructor
public class ProductBrandRepositoryAdapter implements ProductBrandRepositoryPort {

    private final ProductBrandRepository productBrandRepository;

    @Override
    public ProductBrand save(ProductBrand productBrand) {
        return productBrandRepository.save(productBrand);
    }

    @Override
    public ProductBrand findById(Long brandId) {
        return productBrandRepository.findById(brandId)
                .orElseThrow(() -> new EntityNotFoundException(
                        String.format(ProductBrandMessages.MESSAGE_PRODUCT_BRAND_NOT_FOUND_BY_ID, brandId)));
    }

    @Override
    public ProductBrand findByIdAndActiveAndDeleted(Long brandId, boolean isActive, boolean isDeleted) {
        if(brandId == null) {
            return null;
        }
        return productBrandRepository
                .findByIdAndIsActiveAndIsDeleted(brandId, isActive, isDeleted)
                .orElseThrow(() -> new EntityNotFoundException(
                        String.format(ProductBrandMessages.MESSAGE_PRODUCT_BRAND_NOT_FOUND_BY_ID, brandId)));
    }



    @Override
    public List<ProductBrand> findAll() {
        return productBrandRepository
                .findAll()
                .stream()
                .toList();
    }

    @Override
    public boolean existsByName(String name) {
        return productBrandRepository.existsByName(name);
    }

    @Override
    public boolean existsByNameAndIdNot(String name, Long brandId) {
        return productBrandRepository
                .findByName(name)
                .isPresent();
    }

    @Override
    public ProductBrand getReferenceById(Long brandId) {
        return productBrandRepository
                .getReferenceById(brandId);
    }
}

