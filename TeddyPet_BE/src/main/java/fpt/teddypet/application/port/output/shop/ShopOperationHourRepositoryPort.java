package fpt.teddypet.application.port.output.shop;

import fpt.teddypet.domain.entity.ShopOperationHour;

import java.util.List;
import java.util.Optional;

public interface ShopOperationHourRepositoryPort {

    ShopOperationHour save(ShopOperationHour entity);

    Optional<ShopOperationHour> findById(Long id);

    List<ShopOperationHour> findAllActive();

    Optional<ShopOperationHour> findByDayOfWeek(Integer dayOfWeek);

    boolean existsByDayOfWeek(Integer dayOfWeek);

    boolean existsByDayOfWeekAndIdNot(Integer dayOfWeek, Long id);
}
