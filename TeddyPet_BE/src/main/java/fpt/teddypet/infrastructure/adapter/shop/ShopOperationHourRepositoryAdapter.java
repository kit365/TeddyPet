package fpt.teddypet.infrastructure.adapter.shop;

import fpt.teddypet.application.port.output.shop.ShopOperationHourRepositoryPort;
import fpt.teddypet.domain.entity.ShopOperationHour;
import fpt.teddypet.infrastructure.persistence.postgres.repository.shop.ShopOperationHourRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class ShopOperationHourRepositoryAdapter implements ShopOperationHourRepositoryPort {

    private final ShopOperationHourRepository repository;

    @Override
    public ShopOperationHour save(ShopOperationHour entity) {
        return repository.save(entity);
    }

    @Override
    public Optional<ShopOperationHour> findById(Long id) {
        return repository.findById(id);
    }

    @Override
    public List<ShopOperationHour> findAllActive() {
        return repository.findByIsDeletedFalseOrderByDayOfWeekAsc();
    }

    @Override
    public Optional<ShopOperationHour> findByDayOfWeek(Integer dayOfWeek) {
        return repository.findByDayOfWeekAndIsDeletedFalse(dayOfWeek);
    }

    @Override
    public boolean existsByDayOfWeek(Integer dayOfWeek) {
        return repository.existsByDayOfWeekAndIsDeletedFalse(dayOfWeek);
    }

    @Override
    public boolean existsByDayOfWeekAndIdNot(Integer dayOfWeek, Long id) {
        return repository.existsByDayOfWeekAndIsDeletedFalseAndIdNot(dayOfWeek, id);
    }
}
