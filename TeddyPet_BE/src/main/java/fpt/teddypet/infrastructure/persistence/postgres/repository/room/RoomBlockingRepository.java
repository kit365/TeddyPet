package fpt.teddypet.infrastructure.persistence.postgres.repository.room;

import fpt.teddypet.domain.entity.RoomBlocking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RoomBlockingRepository extends JpaRepository<RoomBlocking, Long> {
}
