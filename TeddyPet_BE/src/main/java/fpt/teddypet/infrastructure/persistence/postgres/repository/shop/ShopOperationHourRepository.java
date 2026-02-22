package fpt.teddypet.infrastructure.persistence.postgres.repository.shop;

import fpt.teddypet.domain.entity.ShopOperationHour;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ShopOperationHourRepository extends JpaRepository<ShopOperationHour, Long> {

    List<ShopOperationHour> findByIsDeletedFalseOrderByDayOfWeekAsc();

    Optional<ShopOperationHour> findByDayOfWeekAndIsDeletedFalse(Integer dayOfWeek);

    boolean existsByDayOfWeekAndIsDeletedFalse(Integer dayOfWeek);

    boolean existsByDayOfWeekAndIsDeletedFalseAndIdNot(Integer dayOfWeek, Long id);
}
