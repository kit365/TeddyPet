package fpt.teddypet.infrastructure.persistence.postgres.repository.shop;

import fpt.teddypet.domain.entity.TimeSlotException;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TimeSlotExceptionRepository extends JpaRepository<TimeSlotException, Long> {

    List<TimeSlotException> findByIsDeletedFalseOrderByStartDateDesc();

    List<TimeSlotException> findByServiceIdAndIsDeletedFalse(Long serviceId);

    List<TimeSlotException> findByServiceIdIsNullAndIsDeletedFalse();
}
