package fpt.teddypet.application.port.output.shop;

import fpt.teddypet.domain.entity.TimeSlot;

import java.util.List;
import java.util.Optional;

public interface TimeSlotRepositoryPort {

    TimeSlot save(TimeSlot entity);

    List<TimeSlot> saveAll(Iterable<TimeSlot> entities);

    Optional<TimeSlot> findById(Long id);

    List<TimeSlot> findByServiceId(Long serviceId);

    void delete(TimeSlot entity);
<<<<<<< HEAD

    List<TimeSlot> findByServiceIdAndDayType(Long serviceId, fpt.teddypet.domain.enums.scheduling.DayTypeEnum dayType);
=======
<<<<<<< Updated upstream
=======

    List<TimeSlot> findByServiceIdAndDayType(Long serviceId,
            fpt.teddypet.domain.enums.scheduling.DayTypeEnum dayType);

    /** All non-deleted slots across all services. */
    List<TimeSlot> findAllActive();
>>>>>>> Stashed changes
>>>>>>> shop_management_feature/phudm
}
