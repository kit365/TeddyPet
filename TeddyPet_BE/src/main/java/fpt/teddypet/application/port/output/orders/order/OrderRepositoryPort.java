package fpt.teddypet.application.port.output.orders.order;

import fpt.teddypet.domain.entity.Order;
import fpt.teddypet.domain.enums.orders.OrderStatusEnum;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
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
    Optional<Order> findByOrderCodeAndGuestEmail(String orderCode, String guestEmail);

    Optional<Order> findByOrderCodeAndEmailOrPhone(String orderCode, String identifier);

    List<Order> findByStatusAndDeliveringAtBefore(OrderStatusEnum status, LocalDateTime dateTime);

    List<Order> findByStatusAndDeliveredAtBefore(OrderStatusEnum status, LocalDateTime dateTime);

    List<Order> findExpiredBankTransferOrders(fpt.teddypet.domain.enums.orders.OrderStatusEnum status,
            fpt.teddypet.domain.enums.payments.PaymentMethodEnum method,
            LocalDateTime expiryTime);
}
