package fpt.teddypet.infrastructure.scheduler;

import fpt.teddypet.application.port.output.orders.order.OrderRepositoryPort;
import fpt.teddypet.domain.entity.Order;
import fpt.teddypet.domain.enums.orders.OrderStatusEnum;
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
public class OrderScheduler {

    private final OrderRepositoryPort orderRepositoryPort;

    /**
     * Tự động hoàn thành đơn hàng nếu đã giao quá 3 ngày mà khách không bấm nhận
     * Chạy mỗi giờ một lần
     */
    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void autoConfirmOrders() {
        log.info("Starting auto-confirm orders task...");

        LocalDateTime threshold = LocalDateTime.now().minusDays(3);

        List<Order> deliveringOrders = orderRepositoryPort.findByStatusAndDeliveringAtBefore(
                OrderStatusEnum.DELIVERING, threshold);

        log.info("Found {} orders to auto-confirm", deliveringOrders.size());

        for (Order order : deliveringOrders) {
            try {
                order.setStatus(OrderStatusEnum.DELIVERED);
                orderRepositoryPort.save(order);
                log.info("Auto-confirmed order: #{}", order.getOrderCode());
            } catch (Exception e) {
                log.error("Failed to auto-confirm order #{}", order.getOrderCode(), e);
            }
        }

        log.info("Finished auto-confirm orders task");
    }
}
