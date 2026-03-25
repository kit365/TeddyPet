package fpt.teddypet.infrastructure.persistence.postgres.data;

import fpt.teddypet.domain.entity.RoomType;
import fpt.teddypet.domain.entity.Service;
import fpt.teddypet.domain.entity.ServicePricing;
import fpt.teddypet.infrastructure.persistence.postgres.repository.room.RoomTypeRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.services.ServicePricingRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.services.ServiceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Gán room_type cho các quy tắc giá của dịch vụ lưu trú (isRequiredRoom=true),
 * để FE có thể hiển thị giá theo loại phòng + cân nặng + loại thú cưng.
 *
 * Idempotent:
 * - Chỉ chạy khi đã có room_types và service_pricing tương ứng.
 * - Nếu đã có roomType gắn vào pricing thì bỏ qua (ưu tiên cấu hình tay từ admin).
 */
@Slf4j
@Component
@Order(18)
@RequiredArgsConstructor
public class ServicePricingRoomTypeInitializer implements CommandLineRunner {

    private static final String SERVICE_CODE_HOTEL_PHONG_CHUONG = "HOTEL-PHONG-CHUONG";
    private static final String SLUG_ROOMTYPE_PHONG_THUONG = "phong-thuong";
    private static final String SLUG_ROOMTYPE_VIP = "vip";

    private final ServiceRepository serviceRepository;
    private final ServicePricingRepository servicePricingRepository;
    private final RoomTypeRepository roomTypeRepository;

    @Value("${data.init.services.enabled:true}")
    private boolean enabled;

    @Override
    public void run(String... args) {
        if (!enabled) {
            log.debug("ServicePricingRoomTypeInitializer disabled (data.init.services.enabled=false)");
            return;
        }

        Service hotelService = serviceRepository.findByCode(SERVICE_CODE_HOTEL_PHONG_CHUONG).orElse(null);
        if (hotelService == null) {
            log.debug("Hotel service {} not found, skip pricing roomType backfill", SERVICE_CODE_HOTEL_PHONG_CHUONG);
            return;
        }

        RoomType phongThuong = roomTypeRepository.findBySlug(SLUG_ROOMTYPE_PHONG_THUONG).orElse(null);
        RoomType vip = roomTypeRepository.findBySlug(SLUG_ROOMTYPE_VIP).orElse(null);
        if (phongThuong == null || vip == null) {
            log.debug("RoomTypes for slugs {}, {} not found, skip pricing roomType backfill",
                    SLUG_ROOMTYPE_PHONG_THUONG, SLUG_ROOMTYPE_VIP);
            return;
        }

        List<ServicePricing> all = servicePricingRepository.findByServiceId(hotelService.getId());
        if (all.isEmpty()) {
            log.debug("No pricing rules for service {}, nothing to backfill", SERVICE_CODE_HOTEL_PHONG_CHUONG);
            return;
        }

        boolean alreadyHasRoomType = all.stream().anyMatch(p -> p.getRoomType() != null);
        if (alreadyHasRoomType) {
            log.debug("Service pricing for {} already has roomType set, skip backfill", SERVICE_CODE_HOTEL_PHONG_CHUONG);
            return;
        }

        // Gán tất cả rule hiện tại cho Phòng thường,
        // đồng thời clone sang VIP với giá và điều kiện giống nhau.
        for (ServicePricing p : all) {
            p.setRoomType(phongThuong);
            servicePricingRepository.save(p);

            ServicePricing clone = ServicePricing.builder()
                    .service(hotelService)
                    .roomType(vip)
                    .suitablePetTypes(p.getSuitablePetTypes())
                    .pricingName(p.getPricingName())
                    .price(p.getPrice())
                    .weekendMultiplier(p.getWeekendMultiplier())
                    .peakSeasonMultiplier(p.getPeakSeasonMultiplier())
                    .holidayMultiplier(p.getHolidayMultiplier())
                    .minWeight(p.getMinWeight())
                    .maxWeight(p.getMaxWeight())
                    .effectiveFrom(p.getEffectiveFrom())
                    .effectiveTo(p.getEffectiveTo())
                    .priority(p.getPriority())
                    .build();
            servicePricingRepository.save(clone);
        }

        log.info("✅ Backfilled roomType for {} pricing rules of service {} (standard + VIP)",
                all.size(), SERVICE_CODE_HOTEL_PHONG_CHUONG);
    }
}

