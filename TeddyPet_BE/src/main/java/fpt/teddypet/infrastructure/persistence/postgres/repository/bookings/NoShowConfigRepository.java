package fpt.teddypet.infrastructure.persistence.postgres.repository.bookings;

import fpt.teddypet.domain.entity.NoShowConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NoShowConfigRepository extends JpaRepository<NoShowConfig, Long> {

    @Query("select c from NoShowConfig c where c.isDeleted = false and c.isActive = true order by c.id asc limit 1")
    Optional<NoShowConfig> findActiveConfig();

    List<NoShowConfig> findAllByIsDeletedFalseOrderByIdAsc();

    Optional<NoShowConfig> findByIdAndIsDeletedFalse(Long id);

    @Query("select distinct c from NoShowConfig c left join fetch c.linkedServices ls where c.id = :id and c.isDeleted = false")
    Optional<NoShowConfig> findByIdWithServices(@Param("id") Long id);
}
