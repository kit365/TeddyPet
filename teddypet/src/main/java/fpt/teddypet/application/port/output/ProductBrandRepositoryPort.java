package fpt.teddypet.application.port.output;

import fpt.teddypet.domain.entity.ProductBrand;

import java.util.List;
import java.util.Optional;

public interface ProductBrandRepositoryPort {
    ProductBrand save(ProductBrand productBrand);
    Optional<ProductBrand> findById(Long brandId);
    List<ProductBrand> findAll();
    boolean existsByName(String name);
    boolean existsByNameAndIdNot(String name, Long brandId);
}

