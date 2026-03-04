package fpt.teddypet.infrastructure.persistence.postgres.repository.amenity;

import fpt.teddypet.domain.entity.Amenity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AmenityRepository extends JpaRepository<Amenity, Long> {

    List<Amenity> findByIsActiveTrueAndIsDeletedFalseOrderByDisplayOrderAsc();

    List<Amenity> findByCategoryIdAndIsActiveTrueAndIsDeletedFalseOrderByDisplayOrderAsc(Long categoryId);

    List<Amenity> findByIsDeletedFalseOrderByCategory_IdAscDisplayOrderAsc();

    List<Amenity> findByCategory_IdAndIsDeletedFalseOrderByDisplayOrderAsc(Long categoryId);

}
