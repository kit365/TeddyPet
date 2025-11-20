package fpt.teddypet.infrastructure.adapter;

import fpt.teddypet.application.port.output.ProductBrandRepositoryPort;
import fpt.teddypet.domain.entity.ProductBrand;
import fpt.teddypet.infrastructure.persistence.postgres.repository.ProductBrandRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class ProductBrandRepositoryAdapter implements ProductBrandRepositoryPort {

    private final ProductBrandRepository productBrandRepository;

    @Override
    public ProductBrand save(ProductBrand productBrand) {
        return productBrandRepository.save(productBrand);
    }

    @Override
    public Optional<ProductBrand> findById(Long brandId) {
        return productBrandRepository.findByIdAndIsDeletedFalse(brandId);
    }

    @Override
    public List<ProductBrand> findAll() {
        return productBrandRepository.findAll().stream()
                .filter(brand -> !brand.isDeleted())
                .toList();
    }

    @Override
    public boolean existsByName(String name) {
        return productBrandRepository.existsByName(name);
    }

    @Override
    public boolean existsByNameAndIdNot(String name, Long brandId) {
        return productBrandRepository.findByName(name)
                .filter(brand -> !brand.getId().equals(brandId) && !brand.isDeleted())
                .isPresent();
    }
}

