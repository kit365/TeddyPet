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
     * Tự động hoàn thành đơn hàng nếu đã giao thành công quá 1 ngày mà khách không
     * bấm nhận
     * Chạy mỗi ngày lúc 00:00 để tiết kiệm tài nguyên
     */
    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void autoCompleteDeliveredOrders() {
        log.info("Starting auto-complete delivered orders task...");

        LocalDateTime threshold = LocalDateTime.now().minusDays(1);

        // Tìm các đơn đã giao thành công (DELIVERED) quá 1 ngày
        List<Order> deliveredOrders = orderRepositoryPort.findByStatusAndDeliveredAtBefore(
                OrderStatusEnum.DELIVERED, threshold);

        log.info("Found {} orders to auto-complete", deliveredOrders.size());

        for (Order order : deliveredOrders) {
            try {
                order.setStatus(OrderStatusEnum.COMPLETED);
                orderRepositoryPort.save(order);
                log.info("Auto-completed order: #{}", order.getOrderCode());
            } catch (Exception e) {
                log.error("Failed to auto-complete order #{}", order.getOrderCode(), e);
            }
        }

        log.info("Finished auto-complete delivered orders task");
    }
}
