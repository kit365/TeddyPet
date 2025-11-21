package fpt.teddypet.infrastructure.persistence.postgres.repository;
import fpt.teddypet.domain.entity.ProductAgeRange;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProductAgeRangeRepository extends JpaRepository<ProductAgeRange, Long> {
    Optional<ProductAgeRange> findByName(String name);
    boolean existsByName(String name);
    Optional<ProductAgeRange> findByIdAndIsDeletedFalse(Long ageRangeId);

    List<ProductAgeRange> findAllByIdInAndIsActiveAndIsDeleted(List<Long> ageRangeIds, boolean isActive, boolean isDeleted);
}

