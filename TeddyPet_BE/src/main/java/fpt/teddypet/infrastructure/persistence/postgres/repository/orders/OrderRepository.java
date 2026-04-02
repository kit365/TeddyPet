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

    // Chỉ fetch orderItems + user, để tránh MultipleBagFetchException (payments sẽ được load lazy bằng query riêng).
    @EntityGraph(attributePaths = { "orderItems", "user" })
    @Query("SELECT o FROM Order o ORDER BY o.createdAt DESC")
    List<Order> findAllForExcelExport();
    
    // Dùng cho sendOrderConfirmation: tránh fetch nhiều bag cùng lúc, payments được load lazy khi truy cập.
    @EntityGraph(attributePaths = { "orderItems", "user" })
    @Query("SELECT o FROM Order o WHERE o.id = :id")
    Optional<Order> findByIdWithDetails(UUID id);

    Optional<Order> findByOrderCode(String orderCode);

    Page<Order> findByUserId(UUID userId, Pageable pageable);

    List<Order> findByUserId(UUID userId);

    Page<Order> findByStatus(OrderStatusEnum status, Pageable pageable);

    boolean existsByOrderCode(String orderCode);

    // Guest order lookup
    Optional<Order> findByOrderCodeAndGuestEmail(String orderCode, String guestEmail);

    @Query("SELECT o FROM Order o WHERE o.orderCode = :orderCode AND (o.guestEmail = :identifier OR o.shippingPhone = :identifier)")
    Optional<Order> findByOrderCodeAndEmailOrPhone(String orderCode, String identifier);

    List<Order> findByStatusAndDeliveringAtBefore(OrderStatusEnum status, LocalDateTime dateTime);

    List<Order> findByStatusAndDeliveredAtBefore(OrderStatusEnum status, LocalDateTime dateTime);

    List<Order> findAllByStatusInAndCompletedAtBetween(List<OrderStatusEnum> statuses, LocalDateTime start, LocalDateTime end);

    List<Order> findAllByStatusInAndUpdatedAtBetween(List<OrderStatusEnum> statuses, LocalDateTime start, LocalDateTime end);

    List<Order> findAllByStatusIn(List<OrderStatusEnum> statuses);

    @Query("SELECT DISTINCT o FROM Order o JOIN o.payments p " +
            "WHERE o.status = :status " +
            "AND p.paymentMethod = :method " +
            // Đếm thời gian quá hạn thanh toán tính từ lúc đơn được chuyển sang CONFIRMED (updatedAt)
            "AND o.updatedAt < :expiryTime " +
            "AND p.status = 'PENDING'")
    List<Order> findExpiredBankTransferOrders(OrderStatusEnum status,
            fpt.teddypet.domain.enums.payments.PaymentMethodEnum method,
            LocalDateTime expiryTime);
}
