package fpt.teddypet.application.port.output.shop;

import fpt.teddypet.domain.entity.TimeSlotException;

import java.util.List;
import java.util.Optional;

public interface TimeSlotExceptionRepositoryPort {

    TimeSlotException save(TimeSlotException entity);

    Optional<TimeSlotException> findById(Long id);

    List<TimeSlotException> findAllActive();

    List<TimeSlotException> findByServiceId(Long serviceId);

    void delete(TimeSlotException entity);
}
