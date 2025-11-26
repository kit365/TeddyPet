package fpt.teddypet.application.port.output.products;
import fpt.teddypet.domain.entity.ProductBrand;
import java.util.List;


public interface ProductBrandRepositoryPort {
    ProductBrand save(ProductBrand productBrand);
    ProductBrand findById(Long brandId);
    ProductBrand findByIdAndActiveAndDeleted(Long brandId, boolean isActive, boolean isDeleted);
    List<ProductBrand> findAll();
    boolean existsByName(String name);
    boolean existsByNameAndIdNot(String name, Long brandId);
    ProductBrand getReferenceById(Long brandId);
}

