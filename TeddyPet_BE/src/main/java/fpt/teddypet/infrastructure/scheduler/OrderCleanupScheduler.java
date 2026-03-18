package fpt.teddypet.infrastructure.scheduler;

import fpt.teddypet.application.port.output.orders.order.OrderRepositoryPort;
import fpt.teddypet.application.port.input.orders.order.OrderService;
import fpt.teddypet.domain.entity.Order;
import fpt.teddypet.domain.enums.orders.OrderStatusEnum;
import fpt.teddypet.domain.enums.payments.PaymentMethodEnum;
import fpt.teddypet.domain.enums.payments.PaymentStatusEnum;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class OrderCleanupScheduler {

    private final OrderRepositoryPort orderRepositoryPort;
    private final OrderService orderService;

    /**
     * Tự động hủy các đơn hàng chuyển khoản (BANK_TRANSFER) đã quá 10 phút mà chưa
     * thanh toán.
     * Chạy mỗi 1 phút một lần.
     */
    @Scheduled(fixedRate = 60000) // 1 minute
    @Transactional
    public void cancelExpiredOrders() {
        LocalDateTime expiryTime = LocalDateTime.now().minusMinutes(10);

        // Countdown 10 phút chỉ tính từ lúc đơn được xác nhận (CONFIRMED)
        log.debug("Checking for expired bank transfer orders confirmed before {}", expiryTime);

        // Tìm các đơn hàng:
        // 1. Trạng thái CONFIRMED (đã chốt phí ship)
        // 2. Phương thức BANK_TRANSFER
        // 3. Thời gian tạo (hoặc thời gian xác nhận) trước expiryTime
        // 4. Chưa có thanh toán thành công

        List<Order> expiredOrders = orderRepositoryPort.findExpiredBankTransferOrders(
                OrderStatusEnum.CONFIRMED,
                PaymentMethodEnum.BANK_TRANSFER,
                expiryTime);

        if (!expiredOrders.isEmpty()) {
            log.info("Found {} expired bank transfer orders to cancel", expiredOrders.size());
            for (Order order : expiredOrders) {
                try {
                    // Kiểm tra xem thực sự chưa có thanh toán COMPLETED nào
                    boolean isPaid = order.getPayments().stream()
                            .anyMatch(p -> p.getStatus() == PaymentStatusEnum.COMPLETED);

                    if (!isPaid) {
                        orderService.cancelOrderByAdmin(
                                order.getId(),
                                "Hệ thống tự động hủy do quá 10 phút chưa nhận được thanh toán chuyển khoản.",
                                "SYSTEM");
                        log.info("Auto-cancelled expired order: {}", order.getOrderCode());
                    }
                } catch (Exception e) {
                    log.error("Failed to auto-cancel order {}: {}", order.getOrderCode(), e.getMessage());
                }
            }
        }
    }
}
