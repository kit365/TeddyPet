package fpt.teddypet.application.service.dashboard;

import fpt.teddypet.application.dto.response.dashboard.*;
import fpt.teddypet.application.dto.response.product.product.ProductResponse;
import fpt.teddypet.application.mapper.products.ProductMapper;
import fpt.teddypet.application.service.products.ProductApplicationService;
import fpt.teddypet.domain.entity.*;
import fpt.teddypet.domain.enums.StockStatusEnum;
import fpt.teddypet.domain.enums.PetTypeEnum;
import fpt.teddypet.domain.enums.orders.OrderStatusEnum;
import fpt.teddypet.infrastructure.persistence.postgres.repository.UserRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.orders.OrderRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.products.ProductRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.products.RatingRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.BookingPetServiceRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.BookingRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.BookingPetRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.staff.StaffProfileRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.staff.TaskHistoryRepository;
import fpt.teddypet.domain.entity.staff.StaffProfile;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
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
        private final ProductApplicationService productApplicationService;
        private final org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;
        private final RatingRepository ratingRepository;
        private final StaffProfileRepository staffProfileRepository;
        private final TaskHistoryRepository taskHistoryRepository;

        public DashboardService(
                        OrderRepository orderRepository,
                        UserRepository userRepository,
                        ProductRepository productRepository,
                        BookingPetServiceRepository bookingPetServiceRepository,
                        BookingRepository bookingRepository,
                        BookingPetRepository bookingPetRepository,
                        ProductMapper productMapper,
                        ProductApplicationService productApplicationService,
                        org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate,
                        RatingRepository ratingRepository,
                        StaffProfileRepository staffProfileRepository,
                        TaskHistoryRepository taskHistoryRepository) {
                this.orderRepository = orderRepository;
                this.userRepository = userRepository;
                this.productRepository = productRepository;
                this.bookingPetServiceRepository = bookingPetServiceRepository;
                this.bookingRepository = bookingRepository;
                this.bookingPetRepository = bookingPetRepository;
                this.productMapper = productMapper;
                this.productApplicationService = productApplicationService;
                this.messagingTemplate = messagingTemplate;
                this.ratingRepository = ratingRepository;
                this.staffProfileRepository = staffProfileRepository;
                this.taskHistoryRepository = taskHistoryRepository;
        }

        /**
         * Gửi từng section qua STOMP riêng biệt: 1 section chết không ảnh hưởng section khác.
         */
        public void sendDashboardUpdate() {
                sendSection("/topic/dashboard/stats", this::getStats);
                sendSection("/topic/dashboard/staff-stats", this::getStaffStats);
                sendSection("/topic/dashboard/revenue-chart", () -> getRevenueChart(7));
                sendSection("/topic/dashboard/sales-by-category", this::getSalesByCategory);
                sendSection("/topic/dashboard/top-customers", this::getTopCustomers);
                sendSection("/topic/dashboard/latest-products", this::getLatestProducts);
                sendSection("/topic/dashboard/pet-distribution", this::getPetDistribution);
                sendSection("/topic/dashboard/service-statistics", () -> getServiceStatistics(java.time.LocalDate.now().getYear()));
        }

        @SuppressWarnings("unchecked")
        private <T> void sendSection(String topic, java.util.function.Supplier<T> supplier) {
                try {
                        T payload = supplier.get();
                        if (payload != null) {
                                messagingTemplate.convertAndSend(topic, payload);
                        }
                } catch (Exception e) {
                        // Một section lỗi không làm dừng các section khác
                        org.slf4j.LoggerFactory.getLogger(DashboardService.class).warn("Dashboard section failed: topic={}", topic, e);
                }
        }

        /** Số tiền đơn hàng: ưu tiên finalAmount, nếu null/0 thì dùng subtotal + shipping - discount. */
        private BigDecimal resolveOrderAmount(Order o) {
                if (o.getFinalAmount() != null && o.getFinalAmount().compareTo(BigDecimal.ZERO) > 0) {
                        return o.getFinalAmount();
                }
                BigDecimal sub = o.getSubtotal() != null ? o.getSubtotal() : BigDecimal.ZERO;
                BigDecimal ship = o.getShippingFee() != null ? o.getShippingFee() : BigDecimal.ZERO;
                BigDecimal disc = o.getDiscountAmount() != null ? o.getDiscountAmount() : BigDecimal.ZERO;
                return sub.add(ship).subtract(disc).max(BigDecimal.ZERO);
        }

        /** Kiểm tra thời điểm nằm trong ngày (theo khung giờ VN): at coi là giờ server, so sánh với startOfDay/endOfDay (VN). */
        private boolean isInToday(LocalDateTime at, ZonedDateTime startOfDay, ZonedDateTime endOfDay, ZoneId serverZone) {
                if (at == null) return false;
                Instant instant = at.atZone(serverZone).toInstant();
                return !instant.isBefore(startOfDay.toInstant()) && !instant.isAfter(endOfDay.toInstant());
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
                long totalAdminAccounts = userRepository.countByRole_NameIn(List.of("ADMIN", "STAFF", "SUPER_ADMIN"));

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

                // Today stats — múi giờ VN (Asia/Ho_Chi_Minh), coi createdAt trong DB là server default (hoặc UTC)
                ZoneId vietnam = ZoneId.of("Asia/Ho_Chi_Minh");
                LocalDate today = LocalDate.now(vietnam);
                ZonedDateTime startOfDay = today.atStartOfDay(vietnam);
                ZonedDateTime endOfDay = today.atTime(LocalTime.MAX).atZone(vietnam);
                ZoneId serverZone = ZoneId.systemDefault();
                long todayOrders = allOrders.stream()
                                .filter(o -> isInToday(o.getCreatedAt(), startOfDay, endOfDay, serverZone))
                                .count();
                // Doanh thu hôm nay: đơn tạo trong ngày (theo giờ VN), trừ hủy/trả hàng; số tiền = finalAmount hoặc subtotal+shipping-discount
                BigDecimal todayOrderRevenue = allOrders.stream()
                                .filter(o -> isInToday(o.getCreatedAt(), startOfDay, endOfDay, serverZone)
                                                && o.getStatus() != OrderStatusEnum.CANCELLED
                                                && o.getStatus() != OrderStatusEnum.RETURNED
                                                && o.getStatus() != OrderStatusEnum.RETURN_REQUESTED)
                                .map(o -> resolveOrderAmount(o))
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal todayBookingRevenue = allBookings.stream()
                                .filter(b -> isInToday(b.getCreatedAt(), startOfDay, endOfDay, serverZone)
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
                                .filter(bps -> isInToday(bps.getScheduledStartTime(), startOfDay, endOfDay, serverZone))
                                .count();

                return new DashboardStatsResponse(
                                totalRevenue, totalOrders, totalCustomers, totalProductsSold,
                                totalAdminAccounts,
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
                                fullStats.totalAdminAccounts(),
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
                                .map(p -> {
                                        ProductResponse r = productMapper.toResponse(p);
                                        StockStatusEnum computed = productApplicationService.computeStockStatus(p.getId());
                                        return new ProductResponse(r.productId(), r.slug(), r.name(), r.minPrice(), r.maxPrice(),
                                                        r.status(), r.productType(), computed, r.categories(), r.tags(), r.brand(), r.images(), r.createdAt(), r.variants());
                                })
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

        /** Thống kê dịch vụ theo năm + so sánh với năm trước (dịch vụ được tạo trong năm đó). */
        public ServiceStatisticsWithComparisonResponse getServiceStatistics(Integer year) {
                int y = year != null ? year : LocalDate.now().getYear();
                List<ServiceStatisticsResponse> stats = new ArrayList<>();
                var allServiceBookings = bookingPetServiceRepository.findAll();
                DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM");
                long totalThisYear = 0;
                long totalLastYear = 0;

                for (int month = 1; month <= 12; month++) {
                        LocalDate monthDate = LocalDate.of(y, month, 1);
                        LocalDateTime start = monthDate.atStartOfDay();
                        LocalDateTime end = monthDate.withDayOfMonth(monthDate.lengthOfMonth()).atTime(LocalTime.MAX);

                        Map<String, Long> serviceCounts = new HashMap<>();
                        serviceCounts.put("Cắt tỉa", 0L);
                        serviceCounts.put("Khám bệnh", 0L);
                        serviceCounts.put("Huấn luyện", 0L);

                        for (BookingPetService bps : allServiceBookings) {
                                if (bps.getCreatedAt() == null || bps.getCreatedAt().isBefore(start) || bps.getCreatedAt().isAfter(end))
                                        continue;
                                String serviceName = bps.getService() != null ? bps.getService().getServiceName().toLowerCase() : "";
                                long add = 1;
                                if (serviceName.contains("cắt tỉa") || serviceName.contains("grooming")) {
                                        serviceCounts.put("Cắt tỉa", serviceCounts.get("Cắt tỉa") + add);
                                } else if (serviceName.contains("khám") || serviceName.contains("clinic")) {
                                        serviceCounts.put("Khám bệnh", serviceCounts.get("Khám bệnh") + add);
                                } else if (serviceName.contains("huấn luyện") || serviceName.contains("training")) {
                                        serviceCounts.put("Huấn luyện", serviceCounts.get("Huấn luyện") + add);
                                }
                        }
                        long monthTotal = serviceCounts.values().stream().mapToLong(Long::longValue).sum();
                        totalThisYear += monthTotal;
                        stats.add(new ServiceStatisticsResponse(monthDate.format(fmt), new HashMap<>(serviceCounts)));
                }

                for (int month = 1; month <= 12; month++) {
                        LocalDate monthDate = LocalDate.of(y - 1, month, 1);
                        LocalDateTime start = monthDate.atStartOfDay();
                        LocalDateTime end = monthDate.withDayOfMonth(monthDate.lengthOfMonth()).atTime(LocalTime.MAX);
                        for (BookingPetService bps : allServiceBookings) {
                                if (bps.getCreatedAt() != null && !bps.getCreatedAt().isBefore(start) && !bps.getCreatedAt().isAfter(end))
                                        totalLastYear++;
                        }
                }

                double percentChange = totalLastYear != 0
                        ? ((double) (totalThisYear - totalLastYear) / totalLastYear) * 100.0
                        : (totalThisYear > 0 ? 100.0 : 0.0);

                return new ServiceStatisticsWithComparisonResponse(stats, totalThisYear, totalLastYear, percentChange);
        }

        /** Lượt truy cập theo vùng — stub, sẽ nối Redis/tracking sau. */
        public VisitsByRegionResponse getVisitsByRegion() {
                return VisitsByRegionResponse.empty();
        }

        /** Tăng trưởng thành viên theo tháng (năm nay vs năm trước). */
        public CustomerGrowthResponse getCustomerGrowth() {
                var allUsers = userRepository.findAll();
                int currentYear = LocalDate.now().getYear();
                String[] labels = new String[] { "T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12" };
                List<Long> thisYear = new ArrayList<>();
                List<Long> lastYear = new ArrayList<>();
                for (int month = 1; month <= 12; month++) {
                        LocalDate monthThis = LocalDate.of(currentYear, month, 1);
                        LocalDate monthLast = LocalDate.of(currentYear - 1, month, 1);
                        LocalDateTime startThis = monthThis.atStartOfDay();
                        LocalDateTime endThis = monthThis.withDayOfMonth(monthThis.lengthOfMonth()).atTime(LocalTime.MAX);
                        LocalDateTime startLast = monthLast.atStartOfDay();
                        LocalDateTime endLast = monthLast.withDayOfMonth(monthLast.lengthOfMonth()).atTime(LocalTime.MAX);
                        long countThis = allUsers.stream().filter(u -> u.getCreatedAt() != null && !u.getCreatedAt().isBefore(startThis) && !u.getCreatedAt().isAfter(endThis)).count();
                        long countLast = allUsers.stream().filter(u -> u.getCreatedAt() != null && !u.getCreatedAt().isBefore(startLast) && !u.getCreatedAt().isAfter(endLast)).count();
                        thisYear.add(countThis);
                        lastYear.add(countLast);
                }
                return new CustomerGrowthResponse(thisYear, lastYear, labels);
        }

        /** Sản phẩm bán chạy theo số lượng đã bán (7 ngày, 30 ngày, hoặc toàn thời gian). */
        public List<TopSellingProductResponse> getTopSellingProducts(Integer days) {
                LocalDateTime since = days != null ? LocalDate.now().minusDays(days).atStartOfDay() : null;
                Map<Long, Long> productIdToQty = new HashMap<>();
                for (Order order : orderRepository.findAll()) {
                        if (order.getStatus() != OrderStatusEnum.COMPLETED && order.getStatus() != OrderStatusEnum.DELIVERED) continue;
                        if (since != null && (order.getCreatedAt() == null || order.getCreatedAt().isBefore(since))) continue;
                        for (OrderItem item : order.getOrderItems()) {
                                if (item.getProduct() == null) continue;
                                Long pid = item.getProduct().getId();
                                productIdToQty.merge(pid, (long) item.getQuantity(), Long::sum);
                        }
                }
                List<Long> topIds = productIdToQty.entrySet().stream()
                                .sorted(Map.Entry.<Long, Long>comparingByValue().reversed())
                                .limit(5)
                                .map(Map.Entry::getKey)
                                .toList();
                List<TopSellingProductResponse> result = new ArrayList<>();
                for (Long id : topIds) {
                        productRepository.findById(id).ifPresent(p -> result.add(new TopSellingProductResponse(
                                productMapper.toResponse(p), productIdToQty.getOrDefault(id, 0L))));
                }
                return result;
        }

        /** Tổng hợp đánh giá: điểm TB + số lượt đánh giá. */
        public RatingSummaryResponse getRatingSummary() {
                Double avgVal = ratingRepository.getAverageScore();
                BigDecimal avg = avgVal != null ? BigDecimal.valueOf(avgVal) : BigDecimal.ZERO;
                long count = ratingRepository.countByIsDeletedFalse();
                return new RatingSummaryResponse(avg, count);
        }

        /** Nhân viên tiêu biểu (top 5 theo số task hoàn thành). */
        public List<TopStaffResponse> getTopStaff() {
                List<Object[]> counts = taskHistoryRepository.countCompletedByStaffId();
                Map<Long, Long> staffIdToCount = new HashMap<>();
                for (Object[] row : counts) {
                        staffIdToCount.put((Long) row[0], (Long) row[1]);
                }
                List<StaffProfile> all = staffProfileRepository.findAllActive();
                List<StaffProfile> sorted = all.stream()
                                .sorted(Comparator.comparingLong((StaffProfile s) -> staffIdToCount.getOrDefault(s.getId(), 0L)).reversed())
                                .limit(5)
                                .toList();
                return sorted.stream().map(s -> new TopStaffResponse(
                        s.getId(),
                        s.getFullName(),
                        s.getAvatarUrl(),
                        s.getPosition() != null ? s.getPosition().getName() : "",
                        staffIdToCount.getOrDefault(s.getId(), 0L)))
                        .toList();
        }
}
