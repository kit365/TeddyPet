package fpt.teddypet.infrastructure.persistence.postgres.repository.room;

import fpt.teddypet.domain.entity.RoomLayoutConfig;
import fpt.teddypet.domain.enums.RoomLayoutStatusEnum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RoomLayoutConfigRepository extends JpaRepository<RoomLayoutConfig, Long> {

    List<RoomLayoutConfig> findAllByOrderByIdAsc();

    /**
     * All layouts attached to a specific service, ordered by id ascending.
     * Used by RoomLayoutPositionInitializer to pick the first layout for seeding positions.
     */
    List<RoomLayoutConfig> findByService_IdOrderByIdAsc(Long serviceId);

    List<RoomLayoutConfig> findByService_IdAndStatusOrderByIdAsc(Long serviceId, RoomLayoutStatusEnum status);
}
