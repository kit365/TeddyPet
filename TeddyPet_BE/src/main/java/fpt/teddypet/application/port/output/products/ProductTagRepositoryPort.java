package fpt.teddypet.application.port.output.products;

import fpt.teddypet.domain.entity.ProductTag;

import java.util.List;
import java.util.Optional;

public interface ProductTagRepositoryPort {
    ProductTag save(ProductTag productTag);
    Optional<ProductTag> findById(Long tagId);
    List<ProductTag> findAll();
    boolean existsByName(String name);
    boolean existsByNameAndIdNot(String name, Long tagId);
    List<ProductTag> findAllByIdInAndIsActiveAndIsDeleted(List<Long> tagIds, boolean isActive, boolean isDeleted);
}

