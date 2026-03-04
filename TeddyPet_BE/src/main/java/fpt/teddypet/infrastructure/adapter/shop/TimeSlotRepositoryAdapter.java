package fpt.teddypet.infrastructure.adapter.shop;

import fpt.teddypet.application.port.output.shop.TimeSlotRepositoryPort;
import fpt.teddypet.domain.entity.TimeSlot;
import fpt.teddypet.infrastructure.persistence.postgres.repository.shop.TimeSlotRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class TimeSlotRepositoryAdapter implements TimeSlotRepositoryPort {

    private final TimeSlotRepository repository;

    @Override
    public TimeSlot save(TimeSlot entity) {
        return repository.save(entity);
    }

    @Override
    public List<TimeSlot> saveAll(Iterable<TimeSlot> entities) {
        return repository.saveAll(entities);
    }

    @Override
    public Optional<TimeSlot> findById(Long id) {
        return repository.findById(id);
    }

    @Override
    public List<TimeSlot> findByServiceId(Long serviceId) {
        return repository.findByService_IdAndIsDeletedFalse(serviceId);
    }

    @Override
    public void delete(TimeSlot entity) {
        repository.delete(entity);
    }

    @Override
    public List<TimeSlot> findByServiceIdAndDayType(Long serviceId,
            fpt.teddypet.domain.enums.scheduling.DayTypeEnum dayType) {
        return repository.findByService_IdAndDayTypeAndIsDeletedFalse(serviceId, dayType);
    }
}
