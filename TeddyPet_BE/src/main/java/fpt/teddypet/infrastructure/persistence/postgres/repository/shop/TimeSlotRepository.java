package fpt.teddypet.infrastructure.persistence.postgres.repository.shop;

import fpt.teddypet.domain.entity.TimeSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TimeSlotRepository extends JpaRepository<TimeSlot, Long> {

    List<TimeSlot> findByIsDeletedFalse();

    List<TimeSlot> findByService_IdAndIsDeletedFalse(Long serviceId);
}
