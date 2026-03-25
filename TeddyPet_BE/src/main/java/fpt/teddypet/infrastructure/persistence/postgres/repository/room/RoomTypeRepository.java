package fpt.teddypet.infrastructure.persistence.postgres.repository.room;

import fpt.teddypet.domain.entity.RoomType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoomTypeRepository extends JpaRepository<RoomType, Long> {

    Optional<RoomType> findByIdAndIsDeletedFalse(Long id);

    List<RoomType> findByIsActiveTrueAndIsDeletedFalseOrderByDisplayOrderAsc();

    Optional<RoomType> findBySlug(String slug);

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, Long id);
}
