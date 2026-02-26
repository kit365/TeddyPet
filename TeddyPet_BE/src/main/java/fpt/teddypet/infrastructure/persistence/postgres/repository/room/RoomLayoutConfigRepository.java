package fpt.teddypet.infrastructure.persistence.postgres.repository.room;

import fpt.teddypet.domain.entity.RoomLayoutConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RoomLayoutConfigRepository extends JpaRepository<RoomLayoutConfig, Long> {

    List<RoomLayoutConfig> findAllByOrderByIdAsc();
}
