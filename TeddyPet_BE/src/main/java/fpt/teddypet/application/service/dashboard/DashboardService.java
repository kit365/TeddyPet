package fpt.teddypet.application.service.dashboard;

import fpt.teddypet.application.dto.response.dashboard.*;
import fpt.teddypet.application.dto.response.product.product.ProductResponse;
import fpt.teddypet.application.mapper.products.ProductMapper;
import fpt.teddypet.domain.entity.*;
import fpt.teddypet.domain.enums.PetTypeEnum;
import fpt.teddypet.domain.enums.orders.OrderStatusEnum;
import fpt.teddypet.infrastructure.persistence.postgres.repository.UserRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.orders.OrderRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.products.ProductRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.BookingPetServiceRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.BookingRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.BookingPetRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class DashboardService {
        private final OrderRepository orderRepository;
        private final UserRepository userRepository;
        private final ProductRepository productRepository;
        private final BookingPetServiceRepository bookingPetServiceRepository;
        private final BookingRepository bookingRepository;
        private final BookingPetRepository bookingPetRepository;
        private final ProductMapper productMapper;
        private final org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;

        public DashboardService(
                        OrderRepository orderRepository,
                        UserRepository userRepository,
                        ProductRepository productRepository,
                        BookingPetServiceRepository bookingPetServiceRepository,
                        BookingRepository bookingRepository,
                        BookingPetRepository bookingPetRepository,
                        ProductMapper productMapper,
                        org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate) {
                this.orderRepository = orderRepository;
                this.userRepository = userRepository;
                this.productRepository = productRepository;
                this.bookingPetServiceRepository = bookingPetServiceRepository;
                this.bookingRepository = bookingRepository;
                this.bookingPetRepository = bookingPetRepository;
                this.productMapper = productMapper;
                this.messagingTemplate = messagingTemplate;
        }

        public void sendDashboardUpdate() {
                try {
                        DashboardStatsResponse stats = this.getStats();
                        messagingTemplate.convertAndSend("/topic/dashboard/stats", stats);

                        DashboardStatsResponse staffStats = this.getStaffStats();
                        messagingTemplate.convertAndSend("/topic/dashboard/staff-stats", staffStats);
                } catch (Exception e) {
                        // log.error("Error sending dashboard update", e);
                }
        }

        public DashboardStatsResponse getStats() {
                var allOrders = orderRepository.findAll();
                BigDecimal orderRevenue = allOrders.stream()
                                .filter(o -> o.getStatus() == OrderStatusEnum.COMPLETED
                                                || o.getStatus() == OrderStatusEnum.DELIVERED)
                                .map(o -> o.getFinalAmount() != null ? o.getFinalAmount() : BigDecimal.ZERO)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                var allBookings = bookingRepository.findAll();
                BigDecimal bookingRevenue = allBookings.stream()
                                .filter(b -> "COMPLETED".equalsIgnoreCase(b.getStatus()) || "FINISHED".equalsIgnoreCase(b.getStatus()))
                                .map(b -> b.getTotalAmount() != null ? b.getTotalAmount() : BigDecimal.ZERO)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal totalRevenue = orderRevenue.add(bookingRevenue);

                long totalOrders = allOrders.size();
                long totalCustomers = userRepository.count();
                
                // Sold products count - only from completed/delivered orders
                long totalProductsSold = allOrders.stream()
                                .filter(o -> o.getStatus() == OrderStatusEnum.COMPLETED || o.getStatus() == OrderStatusEnum.DELIVERED)
                                .flatMap(o -> o.getOrderItems().stream())
                                .mapToLong(OrderItem::getQuantity)
                                .sum();

                // Count by status
                long pendingOrders = allOrders.stream().filter(o -> o.getStatus() == OrderStatusEnum.PENDING).count();
                long confirmedOrders = allOrders.stream().filter(o -> o.getStatus() == OrderStatusEnum.CONFIRMED).count();
                long processingOrders = allOrders.stream().filter(o -> o.getStatus() == OrderStatusEnum.PROCESSING).count();
                long deliveringOrders = allOrders.stream().filter(o -> o.getStatus() == OrderStatusEnum.DELIVERING).count();
                long deliveredOrders = allOrders.stream().filter(o -> o.getStatus() == OrderStatusEnum.DELIVERED).count();
                long completedOrders = allOrders.stream().filter(o -> o.getStatus() == OrderStatusEnum.COMPLETED).count();
                long cancelledOrders = allOrders.stream().filter(o -> o.getStatus() == OrderStatusEnum.CANCELLED).count();
                long returnedOrders = allOrders.stream().filter(o -> o.getStatus() == OrderStatusEnum.RETURNED || o.getStatus() == OrderStatusEnum.RETURN_REQUESTED).count();

                // Today stats
                LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
                LocalDateTime endOfDay = LocalDate.now().atTime(LocalTime.MAX);
                long todayOrders = allOrders.stream()
                                .filter(o -> o.getCreatedAt() != null
                                                && !o.getCreatedAt().isBefore(startOfDay)
                                                && !o.getCreatedAt().isAfter(endOfDay))
                                .count();
                BigDecimal todayOrderRevenue = allOrders.stream()
                                .filter(o -> o.getCreatedAt() != null
                                                && !o.getCreatedAt().isBefore(startOfDay)
                                                && !o.getCreatedAt().isAfter(endOfDay)
                                                && (o.getStatus() == OrderStatusEnum.COMPLETED
                                                                || o.getStatus() == OrderStatusEnum.DELIVERED))
                                .map(o -> o.getFinalAmount() != null ? o.getFinalAmount() : BigDecimal.ZERO)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal todayBookingRevenue = allBookings.stream()
                                .filter(b -> b.getCreatedAt() != null
                                                && !b.getCreatedAt().isBefore(startOfDay)
                                                && !b.getCreatedAt().isAfter(endOfDay)
                                                && ("COMPLETED".equalsIgnoreCase(b.getStatus()) || "FINISHED".equalsIgnoreCase(b.getStatus())))
                                .map(b -> b.getTotalAmount() != null ? b.getTotalAmount() : BigDecimal.ZERO)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal todayRevenue = todayOrderRevenue.add(todayBookingRevenue);

                // Low stock products
                long lowStockCount = productRepository.findAll().stream()
                                .filter(p -> p.getStockStatus() == fpt.teddypet.domain.enums.StockStatusEnum.LOW_STOCK
                                                || p.getStockStatus() == fpt.teddypet.domain.enums.StockStatusEnum.OUT_OF_STOCK)
                                .count();

                // Today's bookings
                long todayBookings = bookingPetServiceRepository.findAll().stream()
                                .filter(bps -> bps.getScheduledStartTime() != null
                                                && !bps.getScheduledStartTime().isBefore(startOfDay)
                                                && !bps.getScheduledStartTime().isAfter(endOfDay))
                                .count();

                return new DashboardStatsResponse(
                                totalRevenue, totalOrders, totalCustomers, totalProductsSold,
                                pendingOrders, confirmedOrders, processingOrders, deliveringOrders,
                                deliveredOrders, completedOrders, cancelledOrders, returnedOrders,
                                todayOrders, todayRevenue, lowStockCount, todayBookings);
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

                        BigDecimal orderRevenueForDay = allOrders.stream()
                                        .filter(o -> o.getCreatedAt() != null
                                                        && !o.getCreatedAt().isBefore(start)
                                                        && !o.getCreatedAt().isAfter(end)
                                                        && o.getStatus() != OrderStatusEnum.CANCELLED
                                                        && o.getStatus() != OrderStatusEnum.RETURNED)
                                        .map(o -> o.getFinalAmount() != null ? o.getFinalAmount() : BigDecimal.ZERO)
                                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                        var allBookings = bookingRepository.findAll();
                        BigDecimal bookingRevenueForDay = allBookings.stream()
                                        .filter(b -> b.getCreatedAt() != null
                                                        && !b.getCreatedAt().isBefore(start)
                                                        && !b.getCreatedAt().isAfter(end)
                                                        && ! "CANCELLED".equalsIgnoreCase(b.getStatus()))
                                        .map(b -> b.getTotalAmount() != null ? b.getTotalAmount() : BigDecimal.ZERO)
                                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                        BigDecimal revenue = orderRevenueForDay.add(bookingRevenueForDay);

                        long orders = allOrders.stream()
                                        .filter(o -> o.getCreatedAt() != null
                                                        && !o.getCreatedAt().isBefore(start)
                                                        && !o.getCreatedAt().isAfter(end))
                                        .count() + 
                                      allBookings.stream()
                                        .filter(b -> b.getCreatedAt() != null
                                                        && !b.getCreatedAt().isBefore(start)
                                                        && !b.getCreatedAt().isAfter(end))
                                        .count();

                        items.add(new RevenueChartItem(date.format(fmt), revenue, orders));
                }
                return items;
        }

        public DashboardStatsResponse getStaffStats() {
                DashboardStatsResponse fullStats = getStats();
                // Mask revenue for staff
                return new DashboardStatsResponse(
                                BigDecimal.ZERO,
                                fullStats.totalOrders(),
                                fullStats.totalCustomers(),
                                fullStats.totalProducts(),
                                fullStats.pendingOrders(),
                                fullStats.confirmedOrders(),
                                fullStats.processingOrders(),
                                fullStats.deliveringOrders(),
                                fullStats.deliveredOrders(),
                                fullStats.completedOrders(),
                                fullStats.cancelledOrders(),
                                fullStats.returnedOrders(),
                                fullStats.todayOrders(),
                                BigDecimal.ZERO,
                                fullStats.lowStockCount(),
                                fullStats.todayBookings());
        }

        public List<SalesByCategoryResponse> getSalesByCategory() {
                var allOrders = orderRepository.findAll().stream()
                                .filter(o -> o.getStatus() == OrderStatusEnum.COMPLETED
                                                || o.getStatus() == OrderStatusEnum.DELIVERED)
                                .toList();

                Map<PetTypeEnum, Long> countMap = new HashMap<>();
                Map<PetTypeEnum, BigDecimal> revenueMap = new HashMap<>();

                for (Order order : allOrders) {
                        for (OrderItem item : order.getOrderItems()) {
                                Product product = item.getProduct();
                                if (product != null) {
                                        for (ProductCategory category : product.getCategories()) {
                                                if (category.getSuitablePetTypes() != null) {
                                                        for (PetTypeEnum petType : category.getSuitablePetTypes()) {
                                                                countMap.merge(petType, (long) item.getQuantity(), (a, b) -> a + b);
                                                                BigDecimal itemRevenue = item.getUnitPrice().multiply(new BigDecimal(item.getQuantity()));
                                                                revenueMap.merge(petType, itemRevenue, BigDecimal::add);
                                                        }
                                                }
                                        }
                                }
                        }
                }

                return countMap.entrySet().stream()
                                .map(entry -> {
                                        String label = entry.getKey().name();
                                        if ("DOG".equals(label)) label = "Chó";
                                        else if ("CAT".equals(label)) label = "Mèo";
                                        return new SalesByCategoryResponse(label, entry.getValue(), revenueMap.getOrDefault(entry.getKey(), BigDecimal.ZERO));
                                })
                                .toList();
        }

        public List<TopCustomerResponse> getTopCustomers() {
                return orderRepository.findAll().stream()
                                .filter(o -> o.getStatus() == OrderStatusEnum.COMPLETED
                                                || o.getStatus() == OrderStatusEnum.DELIVERED)
                                .filter(o -> o.getUser() != null)
                                .collect(Collectors.groupingBy(Order::getUser))
                                .entrySet().stream()
                                .map(e -> {
                                        User u = e.getKey();
                                        List<Order> userOrders = e.getValue();
                                        BigDecimal totalSpent = userOrders.stream()
                                                        .map(o -> o.getFinalAmount() != null ? o.getFinalAmount()
                                                                        : BigDecimal.ZERO)
                                                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                                        return new TopCustomerResponse(
                                                        u.getFirstName() + " " + u.getLastName(),
                                                        u.getEmail(),
                                                        u.getAvatarUrl(),
                                                        userOrders.size(),
                                                        totalSpent);
                                })
                                .sorted(Comparator.comparing(TopCustomerResponse::totalSpent).reversed())
                                .limit(5)
                                .toList();
        }

        public List<ProductResponse> getLatestProducts() {
                return productRepository.findAll(PageRequest.of(0, 5, Sort.by("createdAt").descending()))
                                .stream()
                                .map(productMapper::toResponse)
                                .toList();
        }

        public List<PetDistributionResponse> getPetDistribution() {
                var allBookingPets = bookingPetRepository.findAll();
                Map<String, Long> distribution = allBookingPets.stream()
                                .collect(Collectors.groupingBy(bp -> {
                                        String type = bp.getPetType() != null ? bp.getPetType().toUpperCase() : "OTHER";
                                        if (type.contains("DOG")) return "Chó";
                                        if (type.contains("CAT")) return "Mèo";
                                        return "Khác";
                                }, Collectors.counting()));

                return List.of(
                                new PetDistributionResponse("Mèo", distribution.getOrDefault("Mèo", 0L), "#00a76f"),
                                new PetDistributionResponse("Chó", distribution.getOrDefault("Chó", 0L), "#36b37e"),
                                new PetDistributionResponse("Khác", distribution.getOrDefault("Khác", 0L), "#1a3b32"));
        }

        public List<ServiceStatisticsResponse> getServiceStatistics() {
                List<ServiceStatisticsResponse> stats = new ArrayList<>();
                var allServiceBookings = bookingPetServiceRepository.findAll();
                LocalDate today = LocalDate.now();
                DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM");

                for (int i = 11; i >= 0; i--) {
                        LocalDate monthDate = today.minusMonths(i);
                        LocalDateTime start = monthDate.withDayOfMonth(1).atStartOfDay();
                        LocalDateTime end = monthDate.withDayOfMonth(monthDate.lengthOfMonth()).atTime(LocalTime.MAX);

                        Map<String, Long> serviceCounts = new HashMap<>();
                        serviceCounts.put("Cắt tỉa", 0L);
                        serviceCounts.put("Khám bệnh", 0L);
                        serviceCounts.put("Huấn luyện", 0L);

                        allServiceBookings.stream()
                                        .filter(bps -> bps.getCreatedAt() != null
                                                        && !bps.getCreatedAt().isBefore(start)
                                                        && !bps.getCreatedAt().isAfter(end))
                                        .forEach(bps -> {
                                                String serviceName = bps.getService() != null ? bps.getService().getServiceName().toLowerCase() : "";
                                                if (serviceName.contains("cắt tỉa") || serviceName.contains("grooming")) {
                                                        serviceCounts.put("Cắt tỉa", serviceCounts.get("Cắt tỉa") + 1);
                                                } else if (serviceName.contains("khám") || serviceName.contains("clinic")) {
                                                        serviceCounts.put("Khám bệnh", serviceCounts.get("Khám bệnh") + 1);
                                                } else if (serviceName.contains("huấn luyện") || serviceName.contains("training")) {
                                                        serviceCounts.put("Huấn luyện", serviceCounts.get("Huấn luyện") + 1);
                                                }
                                        });

                        stats.add(new ServiceStatisticsResponse(monthDate.format(fmt), serviceCounts));
                }
                return stats;
        }
}
