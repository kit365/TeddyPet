package fpt.teddypet.infrastructure.adapter.shop;

import fpt.teddypet.application.port.output.shop.TimeSlotExceptionRepositoryPort;
import fpt.teddypet.domain.entity.TimeSlotException;
import fpt.teddypet.infrastructure.persistence.postgres.repository.shop.TimeSlotExceptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class TimeSlotExceptionRepositoryAdapter implements TimeSlotExceptionRepositoryPort {

    private final TimeSlotExceptionRepository repository;

    @Override
    public TimeSlotException save(TimeSlotException entity) {
        return repository.save(entity);
    }

    @Override
    public Optional<TimeSlotException> findById(Long id) {
        return repository.findById(id);
    }

    @Override
    public List<TimeSlotException> findAllActive() {
        return repository.findByIsDeletedFalseOrderByStartDateDesc();
    }

    @Override
    public List<TimeSlotException> findByServiceId(Long serviceId) {
        if (serviceId == null) {
            return repository.findByServiceIdIsNullAndIsDeletedFalse();
        }
        return repository.findByServiceIdAndIsDeletedFalse(serviceId);
    }

    @Override
    public void delete(TimeSlotException entity) {
        repository.delete(entity);
    }
}
