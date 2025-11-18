package fpt.teddypet.infrastructure.persistence.postgres.repository;

import fpt.teddypet.domain.entity.ProductBrand;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ProductBrandRepository extends JpaRepository<ProductBrand, Long> {
    Optional<ProductBrand> findByName(String name);
    boolean existsByName(String name);
}

