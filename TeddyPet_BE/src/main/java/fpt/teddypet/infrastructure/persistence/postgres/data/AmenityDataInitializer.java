package fpt.teddypet.infrastructure.persistence.postgres.data;

import fpt.teddypet.domain.entity.Amenity;
import fpt.teddypet.domain.entity.AmenityCategory;
import fpt.teddypet.infrastructure.persistence.postgres.repository.amenity.AmenityCategoryRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.amenity.AmenityRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@Order(20)
@RequiredArgsConstructor
public class AmenityDataInitializer implements CommandLineRunner {

    private final AmenityCategoryRepository amenityCategoryRepository;
    private final AmenityRepository amenityRepository;

    @Value("${data.init.amenities.enabled:true}")
    private boolean enabled;

    @Override
    public void run(String... args) {
        if (!enabled) {
            log.info("Amenity data init disabled (data.init.amenities.enabled=false)");
            return;
        }
        if (!amenityCategoryRepository.findByIsActiveTrueAndIsDeletedFalseOrderByDisplayOrderAsc().isEmpty()) {
            log.debug("Amenity categories already exist, skipping");
            return;
        }
        AmenityCategory roomFeatures = AmenityCategory.builder()
                .categoryName("Tiện nghi phòng")
                .serviceCategoryId(null)
                .description("Tiện nghi cơ bản trong phòng")
                .displayOrder(1)
                .icon(null)
                .build();
        roomFeatures = amenityCategoryRepository.save(roomFeatures);
        List<Amenity> roomList = List.of(
                Amenity.builder().category(roomFeatures).description("Điều hòa").displayOrder(1).build(),
                Amenity.builder().category(roomFeatures).description("Camera giám sát").displayOrder(2).build(),
                Amenity.builder().category(roomFeatures).description("Giường/ổ êm").displayOrder(3).build(),
                Amenity.builder().category(roomFeatures).description("Tủ lạnh mini").displayOrder(4).build(),
                Amenity.builder().category(roomFeatures).description("Đồ chơi thú cưng").displayOrder(5).build(),
                Amenity.builder().category(roomFeatures).description("Máy lọc không khí").displayOrder(6).build()
        );
        roomList.forEach(amenityRepository::save);

        AmenityCategory services = AmenityCategory.builder()
                .categoryName("Dịch vụ bổ sung")
                .serviceCategoryId(null)
                .description("Dịch vụ có thể đặt thêm")
                .displayOrder(2)
                .icon(null)
                .build();
        services = amenityCategoryRepository.save(services);
        List<Amenity> svcList = List.of(
                Amenity.builder().category(services).description("Spa tại phòng").displayOrder(1).build(),
                Amenity.builder().category(services).description("Cho ăn đặc biệt").displayOrder(2).build(),
                Amenity.builder().category(services).description("Vận chuyển đón/trả").displayOrder(3).build()
        );
        svcList.forEach(amenityRepository::save);

        log.info("✅ Created amenity categories and sample amenities");
    }
}
