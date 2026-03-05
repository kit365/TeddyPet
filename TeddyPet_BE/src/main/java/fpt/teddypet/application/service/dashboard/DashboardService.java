package fpt.teddypet.application.service.dashboard;

import fpt.teddypet.application.dto.response.dashboard.DashboardStatsResponse;
import fpt.teddypet.application.dto.response.dashboard.RevenueChartItem;
import fpt.teddypet.domain.enums.orders.OrderStatusEnum;
import fpt.teddypet.infrastructure.persistence.postgres.repository.UserRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.orders.OrderRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.products.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    public DashboardStatsResponse getStats() {
        // Total revenue from COMPLETED orders
        var allOrders = orderRepository.findAll();

        BigDecimal totalRevenue = allOrders.stream()
                .filter(o -> o.getStatus() == OrderStatusEnum.COMPLETED
                        || o.getStatus() == OrderStatusEnum.DELIVERED)
                .map(o -> o.getFinalAmount() != null ? o.getFinalAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long totalOrders = allOrders.size();
        long totalCustomers = userRepository.count();
        long totalProducts = productRepository.count();

        // Count by status
        long pendingOrders = allOrders.stream().filter(o -> o.getStatus() == OrderStatusEnum.PENDING).count();
        long confirmedOrders = allOrders.stream().filter(o -> o.getStatus() == OrderStatusEnum.CONFIRMED).count();
        long processingOrders = allOrders.stream().filter(o -> o.getStatus() == OrderStatusEnum.PROCESSING).count();
        long deliveringOrders = allOrders.stream().filter(o -> o.getStatus() == OrderStatusEnum.DELIVERING).count();
        long deliveredOrders = allOrders.stream().filter(o -> o.getStatus() == OrderStatusEnum.DELIVERED).count();
        long completedOrders = allOrders.stream().filter(o -> o.getStatus() == OrderStatusEnum.COMPLETED).count();
        long cancelledOrders = allOrders.stream().filter(o -> o.getStatus() == OrderStatusEnum.CANCELLED).count();
        long returnedOrders = allOrders.stream().filter(o -> o.getStatus() == OrderStatusEnum.RETURNED
                || o.getStatus() == OrderStatusEnum.RETURN_REQUESTED).count();

        // Today stats
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = LocalDate.now().atTime(LocalTime.MAX);
        long todayOrders = allOrders.stream()
                .filter(o -> o.getCreatedAt() != null
                        && !o.getCreatedAt().isBefore(startOfDay)
                        && !o.getCreatedAt().isAfter(endOfDay))
                .count();
        BigDecimal todayRevenue = allOrders.stream()
                .filter(o -> o.getCreatedAt() != null
                        && !o.getCreatedAt().isBefore(startOfDay)
                        && !o.getCreatedAt().isAfter(endOfDay)
                        && (o.getStatus() == OrderStatusEnum.COMPLETED || o.getStatus() == OrderStatusEnum.DELIVERED))
                .map(o -> o.getFinalAmount() != null ? o.getFinalAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new DashboardStatsResponse(
                totalRevenue, totalOrders, totalCustomers, totalProducts,
                pendingOrders, confirmedOrders, processingOrders, deliveringOrders,
                deliveredOrders, completedOrders, cancelledOrders, returnedOrders,
                todayOrders, todayRevenue);
    }

    public List<RevenueChartItem> getRevenueChart(int days) {
        List<RevenueChartItem> items = new ArrayList<>();
        var allOrders = orderRepository.findAll();
        LocalDate today = LocalDate.now();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM");

        for (int i = days - 1; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            LocalDateTime start = date.atStartOfDay();
            LocalDateTime end = date.atTime(LocalTime.MAX);

            BigDecimal revenue = allOrders.stream()
                    .filter(o -> o.getCreatedAt() != null
                            && !o.getCreatedAt().isBefore(start)
                            && !o.getCreatedAt().isAfter(end)
                            && o.getStatus() != OrderStatusEnum.CANCELLED
                            && o.getStatus() != OrderStatusEnum.RETURNED)
                    .map(o -> o.getFinalAmount() != null ? o.getFinalAmount() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            long orders = allOrders.stream()
                    .filter(o -> o.getCreatedAt() != null
                            && !o.getCreatedAt().isBefore(start)
                            && !o.getCreatedAt().isAfter(end))
                    .count();

            items.add(new RevenueChartItem(date.format(fmt), revenue, orders));
        }
        return items;
    }
}
