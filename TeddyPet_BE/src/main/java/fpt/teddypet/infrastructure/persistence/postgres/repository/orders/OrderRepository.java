package fpt.teddypet.infrastructure.persistence.postgres.repository.orders;

import fpt.teddypet.domain.entity.Order;
import fpt.teddypet.domain.enums.orders.OrderStatusEnum;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrderRepository extends JpaRepository<Order, UUID>, JpaSpecificationExecutor<Order> {

    @EntityGraph(attributePaths = { "orderItems", "user", "payments" })
    @Query("SELECT o FROM Order o ORDER BY o.createdAt DESC")
    List<Order> findAllForExcelExport();

    Optional<Order> findByOrderCode(String orderCode);

    Page<Order> findByUserId(UUID userId, Pageable pageable);

    List<Order> findByUserId(UUID userId);

    Page<Order> findByStatus(OrderStatusEnum status, Pageable pageable);

    boolean existsByOrderCode(String orderCode);

    // Guest order lookup
    Optional<Order> findByOrderCodeAndGuestEmail(String orderCode, String guestEmail);

    List<Order> findByStatusAndDeliveringAtBefore(OrderStatusEnum status, LocalDateTime dateTime);

    List<Order> findByStatusAndDeliveredAtBefore(OrderStatusEnum status, LocalDateTime dateTime);
}
