package fpt.teddypet.application.port.output.orders.order;

import fpt.teddypet.domain.entity.Order;
import fpt.teddypet.domain.enums.orders.OrderStatusEnum;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface OrderRepositoryPort {
    Order save(Order order);

    Order findById(UUID orderId);

    Order findByOrderCode(String orderCode);

    Page<Order> findAll(Pageable pageable);

    Page<Order> findByUserId(UUID userId, Pageable pageable);

    Page<Order> findByStatus(OrderStatusEnum status, Pageable pageable);

    Page<Order> searchOrders(String keyword, Pageable pageable);

    List<Order> findByUserId(UUID userId);

    boolean existsByOrderCode(String orderCode);

    Order getReferenceById(UUID orderId);

    // Guest order lookup
    java.util.Optional<Order> findByOrderCodeAndGuestEmail(String orderCode, String guestEmail);
}
