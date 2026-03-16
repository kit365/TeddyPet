package fpt.teddypet.infrastructure.persistence.postgres.repository.orders;

import fpt.teddypet.domain.entity.OrderRefund;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrderRefundRepository extends JpaRepository<OrderRefund, Long> {

    @Query("""
            select r from OrderRefund r
            where r.orderId = :orderId and r.isDeleted = false
            order by r.createdAt desc
            """)
    List<OrderRefund> findByOrderIdNotDeletedOrderByCreatedAtDesc(@Param("orderId") UUID orderId);

    @Query("""
            select r from OrderRefund r
            where r.orderId = :orderId and r.status = :status and r.isDeleted = false
            order by r.createdAt desc
            """)
    List<OrderRefund> findByOrderIdAndStatusNotDeletedOrderByCreatedAtDesc(
            @Param("orderId") UUID orderId,
            @Param("status") String status
    );

    default Optional<OrderRefund> findLatestPending(UUID orderId) {
        return findByOrderIdAndStatusNotDeletedOrderByCreatedAtDesc(orderId, "PENDING").stream().findFirst();
    }
}

