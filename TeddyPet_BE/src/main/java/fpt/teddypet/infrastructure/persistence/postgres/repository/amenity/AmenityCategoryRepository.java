package fpt.teddypet.infrastructure.persistence.postgres.repository.amenity;

import fpt.teddypet.domain.entity.AmenityCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AmenityCategoryRepository extends JpaRepository<AmenityCategory, Long> {

    List<AmenityCategory> findByIsActiveTrueAndIsDeletedFalseOrderByDisplayOrderAsc();

    List<AmenityCategory> findByIsDeletedFalseOrderByDisplayOrderAsc();
}
