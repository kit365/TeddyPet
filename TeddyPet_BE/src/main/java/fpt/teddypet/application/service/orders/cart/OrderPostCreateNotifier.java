package fpt.teddypet.application.service.orders.cart;

import fpt.teddypet.application.port.output.EmailServicePort;
import fpt.teddypet.application.port.input.UserService;
import fpt.teddypet.application.port.input.notification.NotificationService;
import fpt.teddypet.application.service.dashboard.DashboardService;
import fpt.teddypet.domain.entity.Order;
import fpt.teddypet.domain.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Chạy email + notification + dashboard SAU KHI đơn đã lưu, trong luồng khác (@Async).
 * Tránh lỗi MongoDB (lưu notification) làm rollback transaction đơn hàng và gây 500.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OrderPostCreateNotifier {

    private final EmailServicePort emailServicePort;
    private final NotificationService notificationService;
    private final UserService userService;
    private final DashboardService dashboardService;

    /**
     * Chạy bất đồng bộ trong luồng khác (không có transaction) để exception từ MongoDB/email không ảnh hưởng đơn hàng.
     */
    @Async
    public void runAfterOrderCreated(Order savedOrder, boolean isGuest, UUID userId) {
        try {
            emailServicePort.sendOrderConfirmation(savedOrder);
        } catch (Exception e) {
            log.warn("Failed to send order confirmation email for order {}: {}", savedOrder.getOrderCode(), e.getMessage());
        }

        try {
            notificationService.sendToTopic("admin-orders",
                    fpt.teddypet.application.dto.response.notification.NotificationResponse.builder()
                            .title("Đơn hàng mới")
                            .message("Bạn có đơn hàng mới. Mã đơn hàng: " + savedOrder.getOrderCode())
                            .type("ORDER_CREATED")
                            .targetUrl("/admin/order/detail/" + savedOrder.getId())
                            .timestamp(java.time.LocalDateTime.now())
                            .build());
        } catch (Exception e) {
            log.warn("Failed to send admin notification for order {}: {}", savedOrder.getOrderCode(), e.getMessage());
        }

        if (!isGuest && userId != null) {
            try {
                User customer = userService.getById(userId);
                String username = customer != null ? customer.getUsername() : null;
                if (username != null && !username.isBlank()) {
                    notificationService.sendToUser(username,
                            fpt.teddypet.application.dto.response.notification.NotificationResponse.builder()
                                    .title("Đặt hàng thành công")
                                    .message("Đơn hàng #" + savedOrder.getOrderCode() + " của bạn đã được tiếp nhận.")
                                    .type("ORDER_CREATED_CUSTOMER")
                                    .targetUrl("/dashboard/orders/" + savedOrder.getId())
                                    .timestamp(java.time.LocalDateTime.now())
                                    .build());
                }
            } catch (Exception e) {
                log.warn("Failed to send customer notification for order {}: {}", savedOrder.getOrderCode(), e.getMessage());
            }
        }

        try {
            dashboardService.sendDashboardUpdate();
        } catch (Exception e) {
            log.warn("Failed to send dashboard update for order {}: {}", savedOrder.getOrderCode(), e.getMessage());
        }
    }
}
