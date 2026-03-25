package fpt.teddypet.infrastructure.persistence.postgres.data;

import fpt.teddypet.application.util.SlugUtil;
import fpt.teddypet.domain.entity.Service;
import fpt.teddypet.domain.entity.ServiceCategory;
import fpt.teddypet.domain.entity.ServiceCombo;
import fpt.teddypet.domain.entity.ServiceComboService;
import fpt.teddypet.domain.entity.ServiceComboServiceId;
import fpt.teddypet.domain.entity.ServicePricing;
import fpt.teddypet.domain.entity.TimeSlot;
import fpt.teddypet.domain.enums.PetTypeEnum;
import fpt.teddypet.domain.enums.scheduling.DayTypeEnum;
import fpt.teddypet.domain.enums.scheduling.SlotTypeEnum;
import fpt.teddypet.infrastructure.persistence.postgres.repository.services.ServiceCategoryRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.services.ServiceComboRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.services.ServiceComboServiceRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.services.ServicePricingRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.services.ServiceRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.shop.TimeSlotRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Seeds service_categories, services, service_pricing, service_combo, and
 * service_combo_service.
 * Idempotent: skips when data already exists (by slug/code or existing
 * pricing).
 */
@Slf4j
@Component
@Order(10)
@RequiredArgsConstructor
public class ServiceDataInitializer implements CommandLineRunner {

    private final ServiceCategoryRepository categoryRepository;
    private final ServiceRepository serviceRepository;
    private final ServicePricingRepository pricingRepository;
    private final ServiceComboRepository comboRepository;
    private final TimeSlotRepository timeSlotRepository;
    private final ServiceComboServiceRepository comboServiceRepository;

    @Value("${data.init.services.enabled:true}")
    private boolean enabled;

    // --- Weight classes (kg) ---
    private static final BigDecimal W_XS_MIN = new BigDecimal("0");
    private static final BigDecimal W_XS_MAX = new BigDecimal("2");
    private static final BigDecimal W_S_MIN = new BigDecimal("2");
    private static final BigDecimal W_S_MAX = new BigDecimal("5");
    private static final BigDecimal W_M_MIN = new BigDecimal("5");
    private static final BigDecimal W_M_MAX = new BigDecimal("10");
    private static final BigDecimal W_L_MIN = new BigDecimal("10");
    private static final BigDecimal W_L_MAX = new BigDecimal("20");
    private static final BigDecimal W_XL_MIN = new BigDecimal("20");
    // XL max = null (no upper bound)

    @Override
    public void run(String... args) {
        if (!enabled) {
            log.info("Service data init disabled (data.init.services.enabled=false)");
            return;
        }
        initCategories();
        initServicesAndPricing();
        initAdditionalChargeServices();
        updateHotelServicesRequiresRoom();
        updateSuitablePetTypes();
        updatePricingSuitablePetTypes();
        updateServiceDescriptions();
        initTimeSlots();
        initCombos();
    }

    private void initCategories() {
        createCategoryIfNotExists("Nhóm lưu trú (Hotel)", "nhom-luu-tru", "hotel", "per_day",
                "Trong giữ, chăm sóc theo ngày", "#4A90D9");
        createCategoryIfNotExists("Nhóm Spa (dịch vụ chính)", "nhom-spa", "spa", "per_service",
                "Tắm, cạo lông, vệ sinh, tắm thảo dược", "#50C878");

        // Add-on is a property of `services` (isAddon), not a separate category.
        // If older seed created "nhom-addon", migrate its services to Spa and remove
        // the category.
        removeAddonCategoryIfExists();
    }

    private void removeAddonCategoryIfExists() {
        ServiceCategory addonCat = categoryRepository.findBySlug("nhom-addon").orElse(null);
        if (addonCat == null)
            return;

        ServiceCategory spaCat = categoryRepository.findBySlug("nhom-spa").orElse(null);
        if (spaCat == null) {
            log.warn("Cannot remove addon category because spa category is missing");
            return;
        }

        // Re-assign any services currently under addon category to Spa to avoid FK
        // issues.
        var servicesUnderAddon = serviceRepository
                .findByServiceCategory_IdAndIsActiveTrueAndIsDeletedFalse(addonCat.getId());
        if (!servicesUnderAddon.isEmpty()) {
            servicesUnderAddon.forEach(s -> s.setServiceCategory(spaCat));
            serviceRepository.saveAll(servicesUnderAddon);
            log.info("✅ Migrated {} services from nhom-addon to nhom-spa", servicesUnderAddon.size());
        }

        categoryRepository.delete(addonCat);
        log.info("✅ Deleted ServiceCategory: nhom-addon (Add-on)");
    }

    private ServiceCategory createCategoryIfNotExists(String categoryName, String slug, String serviceType,
            String pricingModel, String description, String colorCode) {
        if (categoryRepository.existsBySlug(slug)) {
            log.debug("ServiceCategory slug {} already exists, skipping", slug);
            return categoryRepository.findBySlug(slug).orElseThrow();
        }
        ServiceCategory cat = ServiceCategory.builder()
                .categoryName(categoryName)
                .slug(slug)
                .serviceType(serviceType)
                .pricingModel(pricingModel)
                .description(description)
                .displayOrder(0)
                .colorCode(colorCode)
                .isActive(true)
                .isDeleted(false)
                .build();
        cat = categoryRepository.save(cat);
        log.info("✅ Created ServiceCategory: {}", categoryName);
        return cat;
    }

    private void initServicesAndPricing() {
        ServiceCategory hotelCat = categoryRepository.findBySlug("nhom-luu-tru").orElseThrow();
        ServiceCategory spaCat = categoryRepository.findBySlug("nhom-spa").orElseThrow();

        // --- Hotel (3 services) — isRequiredRoom = true ---
        Service phongChuong = createServiceIfNotExists(hotelCat, "HOTEL-PHONG-CHUONG", "Phòng Chuồng",
                "Trong giữ, chăm sóc theo ngày - Phòng Chuồng", 1440, new BigDecimal("150000"), "ngày", false, 1, true);
        Service phongRieng = createServiceIfNotExists(hotelCat, "HOTEL-PHONG-RIENG", "Phòng Riêng",
                "Trong giữ, chăm sóc theo ngày - Phòng Riêng", 1440, new BigDecimal("225000"), "ngày", false, 2, true);
        Service meoRieng = createServiceIfNotExists(hotelCat, "HOTEL-MEO-RIENG", "Mèo Riêng",
                "Trong giữ, chăm sóc theo ngày - Mèo Riêng", 1440, new BigDecimal("125000"), "ngày", false, 3, true);

        addHotelPricingIfEmpty(phongChuong, new BigDecimal("125000"), new BigDecimal("175000"),
                new BigDecimal("225000"), new BigDecimal("350000"));
        addHotelPricingIfEmpty(phongRieng, new BigDecimal("225000"), new BigDecimal("275000"), new BigDecimal("375000"),
                new BigDecimal("500000"));
        addHotelPricingIfEmpty(meoRieng, new BigDecimal("125000"), new BigDecimal("125000"), new BigDecimal("125000"),
                new BigDecimal("125000"));

        // --- Spa (4 services) ---
        Service tamVeSinh = createServiceIfNotExists(spaCat, "SPA-TAM-VE-SINH", "Tắm vệ sinh (Basic Bath)",
                "Tắm vệ sinh cơ bản", 60, new BigDecimal("150000"), "lần", false, 1, false);
        Service caoLong = createServiceIfNotExists(spaCat, "SPA-CAO-LONG", "Cạo lông toàn thân (Full Shave)",
                "Cạo lông toàn thân", 90, new BigDecimal("300000"), "lần", false, 2, false);
        Service veSinhTongQuat = createServiceIfNotExists(spaCat, "SPA-VE-SINH-TONG-QUAT",
                "Vệ sinh tổng quát (Hygiene Groom)",
                "Chỉ làm vệ sinh tai, móng, cạo bàn chân, bụng, hậu môn, không tắm", 45, new BigDecimal("65000"), "lần",
                false, 3, false);
        Service tamThaoDuoc = createServiceIfNotExists(spaCat, "SPA-TAM-THAO-DUOC", "Tắm dưỡng thảo dược (Herbal Bath)",
                "Ngâm bồn thảo dược", 30, new BigDecimal("75000"), "lần", false, 4, false);

        addSpaPricingIfEmpty(tamVeSinh, new BigDecimal("125000"), new BigDecimal("200000"), new BigDecimal("325000"),
                new BigDecimal("525000"));
        addSpaPricingIfEmpty(caoLong, new BigDecimal("225000"), new BigDecimal("325000"), new BigDecimal("550000"),
                new BigDecimal("800000"));
        addHygienePricingIfEmpty(veSinhTongQuat, new BigDecimal("65000"), new BigDecimal("110000"));
        addHerbalPricingIfEmpty(tamThaoDuoc, new BigDecimal("75000"));

        // --- Add-on (3 services) ---
        Service goRoiLong = createServiceIfNotExists(spaCat, "ADDON-GO-ROI-LONG", "Gỡ rối lông",
                "Theo thời gian (khoảng 50–100k/30 phút). Giá cơ sở mỗi 30 phút.", 30, new BigDecimal("75000"),
                "30 phút", true, 1, false);
        Service triVeRan = createServiceIfNotExists(spaCat, "ADDON-TRI-VE-RAN", "Trị ve rận (Flea & Tick)",
                "Labor 50–100k hoặc gói 150–300k", 30, new BigDecimal("75000"), "lần", true, 2, false);
        Service duongAmDemChan = createServiceIfNotExists(spaCat, "ADDON-DUONG-AM-DEM-CHAN",
                "Dưỡng ẩm đệm chân (Paw Balm)",
                "Dưỡng ẩm đệm chân", 15, new BigDecimal("40000"), "lần", true, 3, false);

        addAddonPricingIfEmpty(goRoiLong, new BigDecimal("75000"));
        addFleaPricingIfEmpty(triVeRan, new BigDecimal("75000"), new BigDecimal("225000"));
        addAddonPricingIfEmpty(duongAmDemChan, new BigDecimal("40000"));

        // --- Add-on nhóm Hotel (mỗi loại dịch vụ có add-on) ---
        Service buaAnThem = createServiceIfNotExists(hotelCat, "ADDON-HOTEL-BUA-AN-THEM", "Bữa ăn thêm (trong ngày)",
                "Bữa ăn bổ sung cho thú cưng lưu trú", 0, new BigDecimal("30000"), "bữa", true, 1, false);
        Service chamSocDacBiet = createServiceIfNotExists(hotelCat, "ADDON-HOTEL-CHAM-SOC-DAC-BIET", "Chăm sóc đặc biệt",
                "Chăm sóc y tế/đặc biệt theo yêu cầu (giá theo thỏa thuận)", 30, new BigDecimal("50000"), "lần", true, 2, false);
        addAddonPricingIfEmpty(buaAnThem, new BigDecimal("30000"));
        addAddonPricingIfEmpty(chamSocDacBiet, new BigDecimal("50000"));
    }

    /**
     * Seed dịch vụ Additional charge (isAdditionalCharge=true) — nhân viên thêm vào booking_pet_service khi phát sinh.
     */
    private void initAdditionalChargeServices() {
        ServiceCategory hotelCat = categoryRepository.findBySlug("nhom-luu-tru").orElse(null);
        ServiceCategory spaCat = categoryRepository.findBySlug("nhom-spa").orElse(null);
        if (spaCat != null) {
            Service veSinhDacBiet = createAdditionalChargeServiceIfNotExists(spaCat, "CHARGE-VE-SINH-DAC-BIET",
                    "Phụ phí vệ sinh đặc biệt",
                    "Phụ phí khi thú cưng cần vệ sinh đặc biệt (bẩn, lâu ngày)", 30, new BigDecimal("50000"));
            addAddonPricingIfEmpty(veSinhDacBiet, new BigDecimal("50000"));

            Service thuocVatTu = createAdditionalChargeServiceIfNotExists(spaCat, "CHARGE-THUOC-VAT-TU",
                    "Phụ phí thuốc / vật tư",
                    "Phụ phí thuốc hoặc vật tư phát sinh ngoài gói dịch vụ", 0, new BigDecimal("0"));
            addAddonPricingIfEmpty(thuocVatTu, new BigDecimal("0"));

            Service giaHan = createAdditionalChargeServiceIfNotExists(spaCat, "CHARGE-GIA-HAN", "Phụ phí gia hạn giữ",
                    "Phụ phí khi khách gia hạn thêm ngày so với dự kiến", 0, new BigDecimal("0"));
            addAddonPricingIfEmpty(giaHan, new BigDecimal("0"));
        }
        if (hotelCat != null) {
            Service phuPhiPhong = createAdditionalChargeServiceIfNotExists(hotelCat, "CHARGE-PHU-PHI-PHONG",
                    "Phụ phí phòng (phát sinh)",
                    "Phụ phí phát sinh liên quan phòng (làm bẩn, hỏng hóc nhẹ...)", 0, new BigDecimal("0"));
            addAddonPricingIfEmpty(phuPhiPhong, new BigDecimal("0"));
        }
    }

    private Service createAdditionalChargeServiceIfNotExists(ServiceCategory category, String code, String serviceName,
            String description, int durationMinutes, BigDecimal basePrice) {
        if (serviceRepository.existsByCode(code)) {
            return serviceRepository.findByCode(code).orElseThrow();
        }
        String slug = SlugUtil.toSlug(serviceName);
        Service svc = Service.builder()
                .serviceCategory(category)
                .code(code)
                .serviceName(serviceName)
                .slug(slug)
                .description(description)
                .duration(durationMinutes)
                .bufferTime(15)
                .advanceBookingHours(24)
                .maxPetsPerSession(1)
                .requiredStaffCount(1)
                .basePrice(basePrice != null ? basePrice : BigDecimal.ZERO)
                .priceUnit("lần")
                .isAddon(false)
                .isAdditionalCharge(true)
                .isRequiredRoom(false)
                .displayOrder(100)
                .suitablePetTypes(Arrays.asList(PetTypeEnum.DOG, PetTypeEnum.CAT))
                /*
                // Refund Policy defaults
                .beforeDeadlineRefundPct(new BigDecimal("100.00"))
                .afterDeadlineRefundPct(new BigDecimal("50.00"))
                .noShowRefundPct(BigDecimal.ZERO)
                .noShowPenalty(BigDecimal.ZERO)
                .allowReschedule(true)
                .rescheduleDeadlineHours(24)
                .rescheduleLimit(2)
                .allowForceMajeure(true)
                .forceMajeureRefundPct(new BigDecimal("100.00"))
                */
                .isActive(true)
                .isDeleted(false)
                .build();
        svc = serviceRepository.save(svc);
        log.info("✅ Created Additional charge Service: {} ({})", serviceName, code);
        return svc;
    }

    private Service createServiceIfNotExists(ServiceCategory category, String code, String serviceName,
            String description, int durationMinutes, BigDecimal basePrice,
            String priceUnit, boolean isAddon, int displayOrder, boolean isRequiredRoom) {
        if (serviceRepository.existsByCode(code)) {
            log.debug("Service code {} already exists, skipping", code);
            return serviceRepository.findByCode(code).orElseThrow();
        }
        String slug = SlugUtil.toSlug(serviceName);
        Service svc = Service.builder()
                .serviceCategory(category)
                .code(code)
                .serviceName(serviceName)
                .slug(slug)
                .description(description)
                .duration(durationMinutes)
                .bufferTime(15)
                .advanceBookingHours(24)
                .maxPetsPerSession(1)
                .requiredStaffCount(1)
                .basePrice(basePrice)
                .priceUnit(priceUnit)
                .isAddon(isAddon)
                .isRequiredRoom(isRequiredRoom)
                .suitablePetTypes(Arrays.asList(PetTypeEnum.DOG, PetTypeEnum.CAT))
                /*
                // Refund Policy defaults
                .beforeDeadlineRefundPct(new BigDecimal("100.00"))
                .afterDeadlineRefundPct(new BigDecimal("50.00"))
                .noShowRefundPct(BigDecimal.ZERO)
                .noShowPenalty(BigDecimal.ZERO)
                .allowReschedule(true)
                .rescheduleDeadlineHours(24)
                .rescheduleLimit(2)
                .allowForceMajeure(true)
                .forceMajeureRefundPct(new BigDecimal("100.00"))
                */
                .isActive(true)
                .isDeleted(false)
                .build();
        svc = serviceRepository.save(svc);
        log.info("✅ Created Service: {} ({}) [isRequiredRoom={}]", serviceName, code, isRequiredRoom);
        return svc;
    }

    /**
     * Idempotent migration: ensure existing Hotel services have
     * isRequiredRoom=true.
     * Handles cases where services were seeded before this flag was introduced.
     */
    private void updateHotelServicesRequiresRoom() {
        String[] hotelCodes = { "HOTEL-PHONG-CHUONG", "HOTEL-PHONG-RIENG", "HOTEL-MEO-RIENG" };
        for (String code : hotelCodes) {
            serviceRepository.findByCode(code).ifPresent(svc -> {
                if (!Boolean.TRUE.equals(svc.getIsRequiredRoom())) {
                    svc.setIsRequiredRoom(true);
                    serviceRepository.save(svc);
                    log.info("✅ Updated isRequiredRoom=true for service: {} ({})", svc.getServiceName(), code);
                }
            });
        }
    }

    /**
     * Idempotent migration: ensure all services have suitablePetTypes = [DOG, CAT].
     */
    private void updateSuitablePetTypes() {
        List<PetTypeEnum> dogCat = Arrays.asList(PetTypeEnum.DOG, PetTypeEnum.CAT);
        serviceRepository.findAll().forEach(svc -> {
            if (svc.getSuitablePetTypes() == null || svc.getSuitablePetTypes().isEmpty()) {
                svc.setSuitablePetTypes(dogCat);
                serviceRepository.save(svc);
                log.info("✅ Updated suitablePetTypes=[DOG,CAT] for service: {} ({})", svc.getServiceName(),
                        svc.getCode());
            }
        });
    }

    /**
     * Idempotent migration: ensure all ServicePricing rows have suitablePetTypes
     * populated.
     * Để đơn giản cho giai đoạn test FE, nếu rule chưa có suitablePetTypes
     * thì set mặc định "DOG,CAT".
     */
    private void updatePricingSuitablePetTypes() {
        pricingRepository.findAll().forEach(p -> {
            if (p.getSuitablePetTypes() == null || p.getSuitablePetTypes().isBlank()) {
                p.setSuitablePetTypes("DOG,CAT");
                pricingRepository.save(p);
                log.info("✅ Backfilled default suitablePetTypes=DOG,CAT for pricing rule {}", p.getPricingName());
            }
        });
    }

    /**
     * Cập nhật mô tả ngắn và mô tả chi tiết (HTML) cho các dịch vụ hiện có nếu đang trống.
     */
    private void updateServiceDescriptions() {
        Map<String, ServiceDescriptionUpdate> updates = getServiceDescriptionUpdates();
        updates.forEach((code, update) -> {
            serviceRepository.findByCode(code).ifPresent(svc -> {
                boolean needShort = svc.getShortDescription() == null || svc.getShortDescription().isBlank();
                boolean needDetail = svc.getDescription() == null || svc.getDescription().isBlank();
                if (needShort || needDetail) {
                    if (needShort)
                        svc.setShortDescription(update.shortDescription());
                    if (needDetail)
                        svc.setDescription(update.descriptionHtml());
                    serviceRepository.save(svc);
                    log.info("✅ Updated descriptions for service: {} ({})", svc.getServiceName(), code);
                }
            });
        });
    }

    private record ServiceDescriptionUpdate(String shortDescription, String descriptionHtml) {}

    private Map<String, ServiceDescriptionUpdate> getServiceDescriptionUpdates() {
        Map<String, ServiceDescriptionUpdate> m = new LinkedHashMap<>();
        // --- Hotel ---
        m.put("HOTEL-PHONG-CHUONG", new ServiceDescriptionUpdate(
                "Phòng chuồng tiêu chuẩn, thoáng mát, phù hợp chó/mèo. Chăm sóc theo ngày với đầy đủ nước uống và vệ sinh.",
                "<p>Phòng chuồng được thiết kế thoáng mát, vệ sinh sạch sẽ mỗi ngày. Thú cưng được cung cấp nước uống và thức ăn theo nhu cầu. Nhân viên kiểm tra sức khỏe và vệ sinh định kỳ.</p><p><strong>Bao gồm:</strong></p><ul><li>Chỗ ở sạch sẽ, an toàn</li><li>Nước uống và khay vệ sinh</li><li>Theo dõi sức khỏe cơ bản</li></ul>"
        ));
        m.put("HOTEL-PHONG-RIENG", new ServiceDescriptionUpdate(
                "Phòng riêng rộng rãi, yên tĩnh cho chó. Có không gian vận động nhẹ và chăm sóc cá nhân hóa.",
                "<p>Phòng riêng phù hợp với chó cần không gian thoải mái hơn. Có khu vực vệ sinh riêng và nhân viên chăm sóc trực tiếp.</p><p><strong>Bao gồm:</strong></p><ul><li>Phòng riêng biệt, không ồn ào</li><li>Nước uống, khay vệ sinh, nệm nằm</li><li>Chăm sóc và vệ sinh theo yêu cầu</li></ul>"
        ));
        m.put("HOTEL-MEO-RIENG", new ServiceDescriptionUpdate(
                "Không gian riêng dành cho mèo: yên tĩnh, ấm áp, có chỗ leo trèo và vệ sinh cát riêng.",
                "<p>Phòng mèo riêng được thiết kế phù hợp tập tính mèo: ít tiếp xúc với chó, có chỗ ẩn nấp và vệ sinh cát. Nhiệt độ và ánh sáng thoải mái.</p><p><strong>Bao gồm:</strong></p><ul><li>Phòng cách âm, ấm áp</li><li>Khay cát, nước, thức ăn</li><li>Chăm sóc nhẹ nhàng, không gây stress</li></ul>"
        ));
        // --- Spa chính ---
        m.put("SPA-TAM-VE-SINH", new ServiceDescriptionUpdate(
                "Tắm rửa cơ bản với sữa tắm chuyên dụng cho thú cưng. Làm sạch lông, da và mùi hôi.",
                "<p>Dịch vụ tắm vệ sinh cơ bản giúp thú cưng sạch sẽ, thơm tho. Sử dụng sữa tắm phù hợp từng loại da/lông.</p><p><strong>Quy trình:</strong></p><ul><li>Kiểm tra da, lông trước khi tắm</li><li>Tắm với sữa tắm chuyên dụng</li><li>Sấy khô và chải lông nhẹ</li></ul><p>Phù hợp chó, mèo mọi kích cỡ. Thời lượng khoảng 60 phút tùy kích thước.</p>"
        ));
        m.put("SPA-CAO-LONG", new ServiceDescriptionUpdate(
                "Cạo lông toàn thân chuyên nghiệp cho thú cưng. Máy cạo an toàn, không gây trầy xước da.",
                "<p>Cạo lông toàn thân phù hợp chó lông dày, dễ rối hoặc cần vệ sinh sâu. Kỹ thuật viên sử dụng máy cạo chuyên dụng và dao cạo an toàn.</p><p><strong>Bao gồm:</strong></p><ul><li>Cạo sát, đều toàn thân</li><li>Vệ sinh vùng bụng, nách, bàn chân</li><li>Tắm nhẹ sau cạo (tùy gói)</li></ul><p>Thời lượng khoảng 90 phút. Nên đặt lịch trước.</p>"
        ));
        m.put("SPA-VE-SINH-TONG-QUAT", new ServiceDescriptionUpdate(
                "Vệ sinh tai, cắt móng, cạo bàn chân, vệ sinh bụng và hậu môn. Không bao gồm tắm.",
                "<p>Vệ sinh tổng quát tập trung vào các bộ phận dễ bám bẩn: tai, móng, kẽ bàn chân, bụng, hậu môn. Không tắm ướt, phù hợp thú cưng cần vệ sinh nhanh hoặc không thích tắm.</p><p><strong>Bao gồm:</strong></p><ul><li>Vệ sinh tai, lấy ráy tai</li><li>Cắt mài móng</li><li>Cạo lông bàn chân, bụng, hậu môn</li></ul><p>Thời lượng khoảng 45 phút.</p>"
        ));
        m.put("SPA-TAM-THAO-DUOC", new ServiceDescriptionUpdate(
                "Ngâm bồn thảo dược giúp da khỏe, lông mượt, giảm ngứa và mùi. Phù hợp da nhạy cảm.",
                "<p>Bồn tắm thảo dược với thành phần tự nhiên giúp làm dịu da, giảm ngứa và mùi hôi. Đặc biệt phù hợp thú cưng da nhạy cảm hoặc sau các dịch vụ cạo lông.</p><p><strong>Lợi ích:</strong></p><ul><li>Da khỏe, lông mượt</li><li>Giảm ngứa, viêm da nhẹ</li><li>Hương thơm tự nhiên, thư giãn</li></ul><p>Thời lượng khoảng 30 phút. Có thể kết hợp với tắm vệ sinh.</p>"
        ));
        // --- Add-on Spa ---
        m.put("ADDON-GO-ROI-LONG", new ServiceDescriptionUpdate(
                "Gỡ rối lông, chải tháo nút. Tính theo thời gian (khoảng 50–100k/30 phút).",
                "<p>Dịch vụ gỡ rối lông dành cho thú cưng lông dài, dễ rối. Kỹ thuật viên dùng lược và sản phẩm dưỡng để gỡ từng phần mà không gây đau.</p><p><strong>Phù hợp:</strong> Chó/mèo lông dài, lông xoăn, lâu ngày không chải. Giá tính theo thời gian thực hiện (khoảng 50–100k/30 phút).</p>"
        ));
        m.put("ADDON-TRI-VE-RAN", new ServiceDescriptionUpdate(
                "Trị ve rận, bọ chét: lao động 50–100k hoặc gói 150–300k tùy mức độ.",
                "<p>Xử lý ve, rận, bọ chét bằng thuốc và quy trình an toàn. Có thể chọn gói lao động (theo thời gian) hoặc gói trọn gói theo mức độ nhiễm.</p><p><strong>Lưu ý:</strong> Thú cưng cần được kiểm tra da trước khi trị. Một số trường hợp nặng có thể cần tái khám hoặc kết hợp thuốc từ bác sĩ thú y.</p>"
        ));
        m.put("ADDON-DUONG-AM-DEM-CHAN", new ServiceDescriptionUpdate(
                "Dưỡng ẩm đệm chân với sáp/kem chuyên dụng. Giảm nứt nẻ, bong tróc bàn chân.",
                "<p>Đệm chân khô, nứt nẻ dễ gây đau và nhiễm trùng. Dịch vụ bôi dưỡng ẩm chuyên dụng giúp đệm chân mềm, khỏe hơn.</p><p><strong>Bao gồm:</strong> Vệ sinh nhẹ bàn chân, bôi sáp/kem dưỡng ẩm, massage nhẹ. Thời lượng khoảng 15 phút. Có thể kết hợp với vệ sinh tổng quát hoặc tắm.</p>"
        ));
        // --- Add-on Hotel ---
        m.put("ADDON-HOTEL-BUA-AN-THEM", new ServiceDescriptionUpdate(
                "Bữa ăn bổ sung trong ngày cho thú cưng lưu trú. Một bữa/đơn, giá cố định.",
                "<p>Thú cưng lưu trú có thể đặt thêm bữa ăn (sáng/trưa/chiều) ngoài khẩu phần cơ bản. Thức ăn phù hợp theo độ tuổi và loại (khô/ướt) theo yêu cầu chủ nuôi.</p><p><strong>Lưu ý:</strong> Một đơn = một bữa. Cần báo trước loại thức ăn và dị ứng (nếu có).</p>"
        ));
        m.put("ADDON-HOTEL-CHAM-SOC-DAC-BIET", new ServiceDescriptionUpdate(
                "Chăm sóc y tế/đặc biệt theo yêu cầu: băng bó, cho thuốc, theo dõi bệnh. Giá theo thỏa thuận.",
                "<p>Áp dụng khi thú cưng cần cho thuốc định kỳ, băng bó vết thương, theo dõi bệnh lý đặc biệt trong thời gian lưu trú. Nhân viên được hướng dẫn cơ bản về thuốc và quy trình từ chủ nuôi hoặc bác sĩ.</p><p><strong>Lưu ý:</strong> Giá tính theo thời gian và độ phức tạp. Cần cung cấp thuốc và hướng dẫn rõ ràng khi gửi thú cưng.</p>"
        ));
        // --- Additional charge (phụ phí) ---
        m.put("CHARGE-VE-SINH-DAC-BIET", new ServiceDescriptionUpdate(
                "Phụ phí khi thú cưng cần vệ sinh đặc biệt: quá bẩn, lâu ngày không tắm, bám bùn/cỏ.",
                "<p>Áp dụng khi tình trạng lông/da của thú cưng vượt mức vệ sinh thông thường (bẩn nặng, lâu ngày không tắm, dính bùn/cỏ, mùi khó xử lý). Nhân viên sẽ tốn thêm thời gian và vật tư để làm sạch an toàn.</p><p>Phụ phí được tính thêm vào hóa đơn dịch vụ tắm/grooming. Giá có thể thay đổi tùy mức độ.</p>"
        ));
        m.put("CHARGE-THUOC-VAT-TU", new ServiceDescriptionUpdate(
                "Phụ phí thuốc hoặc vật tư phát sinh ngoài gói dịch vụ (thuốc trị ve, dầu gội đặc biệt, băng gạc...).",
                "<p>Khi dịch vụ cần dùng thêm thuốc (trị ve, kháng sinh bôi...) hoặc vật tư đặc biệt (dầu gội trị viêm da, băng gạc, bỉm...) không nằm trong gói cơ bản, phụ phí sẽ được cộng vào hóa đơn theo giá thực tế hoặc bảng giá niêm yết.</p><p>Nhân viên sẽ thông báo và xác nhận với khách trước khi sử dụng.</p>"
        ));
        m.put("CHARGE-GIA-HAN", new ServiceDescriptionUpdate(
                "Phụ phí khi khách gia hạn thêm ngày lưu trú so với ngày trả thú đã đăng ký ban đầu.",
                "<p>Áp dụng khi khách hàng muốn đón thú cưng muộn hơn so với ngày kết thúc đã đặt. Phụ phí tính theo từng ngày gia hạn, theo bảng giá loại phòng đang sử dụng.</p><p><strong>Lưu ý:</strong> Cần thông báo gia hạn sớm để chúng tôi sắp xếp phòng và lịch. Giá có thể điều chỉnh theo mùa/ngày lễ.</p>"
        ));
        m.put("CHARGE-PHU-PHI-PHONG", new ServiceDescriptionUpdate(
                "Phụ phí phát sinh liên quan phòng: làm bẩn nặng, hư hỏng nhẹ đồ đạc, dọn dẹp đặc biệt.",
                "<p>Áp dụng khi sau khi trả phòng, phòng hoặc đồ dùng cần vệ sinh/ sửa chữa ngoài mức bình thường (ví dụ: làm bẩn nặng, gặm nát đồ, nôn mửa nhiều...). Phụ phí được tính theo chi phí thực tế hoặc bảng giá bồi thường nhẹ.</p><p>Nhân viên sẽ báo cáo và thông báo cho khách trước khi xuất hóa đơn.</p>"
        ));
        return m;
    }

    /**
     * Seed time slots for all non-addon services if they don't already have any.
     */
    private void initTimeSlots() {
        // Hotel services — daily check-in / check-out slots
        addTimeSlotsIfEmpty("HOTEL-PHONG-CHUONG", new TimeSlotDef[] {
                new TimeSlotDef(DayTypeEnum.WEEKDAY, "08:00", "12:00", 5, SlotTypeEnum.REGULAR, "Ca sáng"),
                new TimeSlotDef(DayTypeEnum.WEEKDAY, "13:00", "17:00", 5, SlotTypeEnum.REGULAR, "Ca chiều"),
                new TimeSlotDef(DayTypeEnum.WEEKEND, "08:00", "12:00", 3, SlotTypeEnum.PEAK, "Ca sáng cuối tuần"),
                new TimeSlotDef(DayTypeEnum.WEEKEND, "13:00", "17:00", 3, SlotTypeEnum.PEAK, "Ca chiều cuối tuần"),
        });
        addTimeSlotsIfEmpty("HOTEL-PHONG-RIENG", new TimeSlotDef[] {
                new TimeSlotDef(DayTypeEnum.WEEKDAY, "08:00", "12:00", 3, SlotTypeEnum.REGULAR, "Ca sáng"),
                new TimeSlotDef(DayTypeEnum.WEEKDAY, "13:00", "17:00", 3, SlotTypeEnum.REGULAR, "Ca chiều"),
                new TimeSlotDef(DayTypeEnum.WEEKEND, "08:00", "12:00", 2, SlotTypeEnum.PEAK, "Ca sáng cuối tuần"),
                new TimeSlotDef(DayTypeEnum.WEEKEND, "13:00", "17:00", 2, SlotTypeEnum.PEAK, "Ca chiều cuối tuần"),
        });
        addTimeSlotsIfEmpty("HOTEL-MEO-RIENG", new TimeSlotDef[] {
                new TimeSlotDef(DayTypeEnum.WEEKDAY, "08:00", "12:00", 4, SlotTypeEnum.REGULAR, "Ca sáng"),
                new TimeSlotDef(DayTypeEnum.WEEKDAY, "13:00", "17:00", 4, SlotTypeEnum.REGULAR, "Ca chiều"),
                new TimeSlotDef(DayTypeEnum.WEEKEND, "08:00", "12:00", 3, SlotTypeEnum.PEAK, "Ca sáng cuối tuần"),
                new TimeSlotDef(DayTypeEnum.WEEKEND, "13:00", "17:00", 3, SlotTypeEnum.PEAK, "Ca chiều cuối tuần"),
        });

        // Spa services — hourly slots
        addTimeSlotsIfEmpty("SPA-TAM-VE-SINH", new TimeSlotDef[] {
                new TimeSlotDef(DayTypeEnum.WEEKDAY, "08:00", "09:00", 3, SlotTypeEnum.REGULAR, null),
                new TimeSlotDef(DayTypeEnum.WEEKDAY, "09:00", "10:00", 3, SlotTypeEnum.REGULAR, null),
                new TimeSlotDef(DayTypeEnum.WEEKDAY, "10:00", "11:00", 3, SlotTypeEnum.REGULAR, null),
                new TimeSlotDef(DayTypeEnum.WEEKDAY, "13:00", "14:00", 3, SlotTypeEnum.REGULAR, null),
                new TimeSlotDef(DayTypeEnum.WEEKDAY, "14:00", "15:00", 3, SlotTypeEnum.REGULAR, null),
                new TimeSlotDef(DayTypeEnum.WEEKDAY, "15:00", "16:00", 3, SlotTypeEnum.REGULAR, null),
                new TimeSlotDef(DayTypeEnum.WEEKEND, "08:00", "09:00", 4, SlotTypeEnum.PEAK, null),
                new TimeSlotDef(DayTypeEnum.WEEKEND, "09:00", "10:00", 4, SlotTypeEnum.PEAK, null),
                new TimeSlotDef(DayTypeEnum.WEEKEND, "10:00", "11:00", 4, SlotTypeEnum.PEAK, null),
                new TimeSlotDef(DayTypeEnum.WEEKEND, "13:00", "14:00", 4, SlotTypeEnum.PEAK, null),
                new TimeSlotDef(DayTypeEnum.WEEKEND, "14:00", "15:00", 4, SlotTypeEnum.PEAK, null),
                new TimeSlotDef(DayTypeEnum.WEEKEND, "15:00", "16:00", 4, SlotTypeEnum.PEAK, null),
        });
        addTimeSlotsIfEmpty("SPA-CAO-LONG", new TimeSlotDef[] {
                new TimeSlotDef(DayTypeEnum.WEEKDAY, "08:00", "09:30", 2, SlotTypeEnum.REGULAR, null),
                new TimeSlotDef(DayTypeEnum.WEEKDAY, "09:30", "11:00", 2, SlotTypeEnum.REGULAR, null),
                new TimeSlotDef(DayTypeEnum.WEEKDAY, "13:00", "14:30", 2, SlotTypeEnum.REGULAR, null),
                new TimeSlotDef(DayTypeEnum.WEEKDAY, "14:30", "16:00", 2, SlotTypeEnum.REGULAR, null),
                new TimeSlotDef(DayTypeEnum.WEEKEND, "08:00", "09:30", 3, SlotTypeEnum.PEAK, null),
                new TimeSlotDef(DayTypeEnum.WEEKEND, "09:30", "11:00", 3, SlotTypeEnum.PEAK, null),
                new TimeSlotDef(DayTypeEnum.WEEKEND, "13:00", "14:30", 3, SlotTypeEnum.PEAK, null),
                new TimeSlotDef(DayTypeEnum.WEEKEND, "14:30", "16:00", 3, SlotTypeEnum.PEAK, null),
        });
        addTimeSlotsIfEmpty("SPA-VE-SINH-TONG-QUAT", new TimeSlotDef[] {
                new TimeSlotDef(DayTypeEnum.WEEKDAY, "08:00", "08:45", 4, SlotTypeEnum.REGULAR, null),
                new TimeSlotDef(DayTypeEnum.WEEKDAY, "08:45", "09:30", 4, SlotTypeEnum.REGULAR, null),
                new TimeSlotDef(DayTypeEnum.WEEKDAY, "09:30", "10:15", 4, SlotTypeEnum.REGULAR, null),
                new TimeSlotDef(DayTypeEnum.WEEKDAY, "10:15", "11:00", 4, SlotTypeEnum.REGULAR, null),
                new TimeSlotDef(DayTypeEnum.WEEKDAY, "13:00", "13:45", 4, SlotTypeEnum.REGULAR, null),
                new TimeSlotDef(DayTypeEnum.WEEKDAY, "13:45", "14:30", 4, SlotTypeEnum.REGULAR, null),
                new TimeSlotDef(DayTypeEnum.WEEKDAY, "14:30", "15:15", 4, SlotTypeEnum.REGULAR, null),
                new TimeSlotDef(DayTypeEnum.WEEKDAY, "15:15", "16:00", 4, SlotTypeEnum.REGULAR, null),
                new TimeSlotDef(DayTypeEnum.WEEKEND, "08:00", "08:45", 5, SlotTypeEnum.PEAK, null),
                new TimeSlotDef(DayTypeEnum.WEEKEND, "08:45", "09:30", 5, SlotTypeEnum.PEAK, null),
                new TimeSlotDef(DayTypeEnum.WEEKEND, "09:30", "10:15", 5, SlotTypeEnum.PEAK, null),
                new TimeSlotDef(DayTypeEnum.WEEKEND, "10:15", "11:00", 5, SlotTypeEnum.PEAK, null),
                new TimeSlotDef(DayTypeEnum.WEEKEND, "13:00", "13:45", 5, SlotTypeEnum.PEAK, null),
                new TimeSlotDef(DayTypeEnum.WEEKEND, "13:45", "14:30", 5, SlotTypeEnum.PEAK, null),
                new TimeSlotDef(DayTypeEnum.WEEKEND, "14:30", "15:15", 5, SlotTypeEnum.PEAK, null),
                new TimeSlotDef(DayTypeEnum.WEEKEND, "15:15", "16:00", 5, SlotTypeEnum.PEAK, null),
        });
        addTimeSlotsIfEmpty("SPA-TAM-THAO-DUOC", new TimeSlotDef[] {
                new TimeSlotDef(DayTypeEnum.WEEKDAY, "08:00", "08:30", 2, SlotTypeEnum.REGULAR, null),
                new TimeSlotDef(DayTypeEnum.WEEKDAY, "08:30", "09:00", 2, SlotTypeEnum.REGULAR, null),
                new TimeSlotDef(DayTypeEnum.WEEKDAY, "09:00", "09:30", 2, SlotTypeEnum.REGULAR, null),
                new TimeSlotDef(DayTypeEnum.WEEKDAY, "09:30", "10:00", 2, SlotTypeEnum.REGULAR, null),
                new TimeSlotDef(DayTypeEnum.WEEKDAY, "10:00", "10:30", 2, SlotTypeEnum.REGULAR, null),
                new TimeSlotDef(DayTypeEnum.WEEKDAY, "10:30", "11:00", 2, SlotTypeEnum.REGULAR, null),
                new TimeSlotDef(DayTypeEnum.WEEKDAY, "13:00", "13:30", 2, SlotTypeEnum.REGULAR, null),
                new TimeSlotDef(DayTypeEnum.WEEKDAY, "13:30", "14:00", 2, SlotTypeEnum.REGULAR, null),
                new TimeSlotDef(DayTypeEnum.WEEKDAY, "14:00", "14:30", 2, SlotTypeEnum.REGULAR, null),
                new TimeSlotDef(DayTypeEnum.WEEKDAY, "14:30", "15:00", 2, SlotTypeEnum.REGULAR, null),
                new TimeSlotDef(DayTypeEnum.WEEKDAY, "15:00", "15:30", 2, SlotTypeEnum.REGULAR, null),
                new TimeSlotDef(DayTypeEnum.WEEKDAY, "15:30", "16:00", 2, SlotTypeEnum.REGULAR, null),
                new TimeSlotDef(DayTypeEnum.WEEKEND, "08:00", "08:30", 3, SlotTypeEnum.PEAK, null),
                new TimeSlotDef(DayTypeEnum.WEEKEND, "08:30", "09:00", 3, SlotTypeEnum.PEAK, null),
                new TimeSlotDef(DayTypeEnum.WEEKEND, "09:00", "09:30", 3, SlotTypeEnum.PEAK, null),
                new TimeSlotDef(DayTypeEnum.WEEKEND, "09:30", "10:00", 3, SlotTypeEnum.PEAK, null),
                new TimeSlotDef(DayTypeEnum.WEEKEND, "10:00", "10:30", 3, SlotTypeEnum.PEAK, null),
                new TimeSlotDef(DayTypeEnum.WEEKEND, "10:30", "11:00", 3, SlotTypeEnum.PEAK, null),
                new TimeSlotDef(DayTypeEnum.WEEKEND, "13:00", "13:30", 3, SlotTypeEnum.PEAK, null),
                new TimeSlotDef(DayTypeEnum.WEEKEND, "13:30", "14:00", 3, SlotTypeEnum.PEAK, null),
                new TimeSlotDef(DayTypeEnum.WEEKEND, "14:00", "14:30", 3, SlotTypeEnum.PEAK, null),
                new TimeSlotDef(DayTypeEnum.WEEKEND, "14:30", "15:00", 3, SlotTypeEnum.PEAK, null),
                new TimeSlotDef(DayTypeEnum.WEEKEND, "15:00", "15:30", 3, SlotTypeEnum.PEAK, null),
                new TimeSlotDef(DayTypeEnum.WEEKEND, "15:30", "16:00", 3, SlotTypeEnum.PEAK, null),
        });
    }

    private void addTimeSlotsIfEmpty(String serviceCode, TimeSlotDef[] defs) {
        Service service = serviceRepository.findByCode(serviceCode).orElse(null);
        if (service == null)
            return;
        if (!timeSlotRepository.findByService_IdAndIsDeletedFalse(service.getId()).isEmpty())
            return;

        for (TimeSlotDef d : defs) {
            TimeSlot slot = TimeSlot.builder()
                    .service(service)
                    .dayType(d.dayType)
                    .startTime(LocalTime.parse(d.start))
                    .endTime(LocalTime.parse(d.end))
                    .maxCapacity(d.capacity)
                    .currentBookings(0)
                    .slotType(d.slotType)
                    .notes(d.notes)
                    .build();
            timeSlotRepository.save(slot);
        }
        log.info("✅ Added {} time slots for service: {} ({})", defs.length, service.getServiceName(), serviceCode);
    }

    private record TimeSlotDef(DayTypeEnum dayType, String start, String end, int capacity, SlotTypeEnum slotType,
            String notes) {
    }

    private void addHotelPricingIfEmpty(Service service, BigDecimal s, BigDecimal m, BigDecimal l, BigDecimal xl) {
        if (!pricingRepository.findByServiceId(service.getId()).isEmpty())
            return;
        BigDecimal xsPrice = s; // XS use S price (image has no XS)
        savePricing(service, "XS", W_XS_MIN, W_XS_MAX, xsPrice, 1);
        savePricing(service, "S", W_S_MIN, W_S_MAX, s, 2);
        savePricing(service, "M", W_M_MIN, W_M_MAX, m, 3);
        savePricing(service, "L", W_L_MIN, W_L_MAX, l, 4);
        savePricing(service, "XL", W_XL_MIN, null, xl, 5);
        log.info("✅ Added 5 weight-band pricings for service: {}", service.getServiceName());
    }

    private void addSpaPricingIfEmpty(Service service, BigDecimal s, BigDecimal m, BigDecimal l, BigDecimal xl) {
        if (!pricingRepository.findByServiceId(service.getId()).isEmpty())
            return;
        BigDecimal xsPrice = s;
        savePricing(service, "XS", W_XS_MIN, W_XS_MAX, xsPrice, 1);
        savePricing(service, "S", W_S_MIN, W_S_MAX, s, 2);
        savePricing(service, "M", W_M_MIN, W_M_MAX, m, 3);
        savePricing(service, "L", W_L_MIN, W_L_MAX, l, 4);
        savePricing(service, "XL", W_XL_MIN, null, xl, 5);
        log.info("✅ Added 5 weight-band pricings for service: {}", service.getServiceName());
    }

    private void addHygienePricingIfEmpty(Service service, BigDecimal smPrice, BigDecimal xlPrice) {
        if (!pricingRepository.findByServiceId(service.getId()).isEmpty())
            return;
        savePricing(service, "XS", W_XS_MIN, W_XS_MAX, smPrice, 1);
        savePricing(service, "S", W_S_MIN, W_S_MAX, smPrice, 2);
        savePricing(service, "M", W_M_MIN, W_M_MAX, smPrice, 3);
        savePricing(service, "L", W_L_MIN, W_L_MAX, smPrice, 4);
        savePricing(service, "XL", W_XL_MIN, null, xlPrice, 5);
        log.info("✅ Added hygiene pricings for service: {}", service.getServiceName());
    }

    private void addHerbalPricingIfEmpty(Service service, BigDecimal price) {
        if (!pricingRepository.findByServiceId(service.getId()).isEmpty())
            return;
        savePricing(service, "Flat", null, null, price, 0);
        log.info("✅ Added herbal pricing for service: {}", service.getServiceName());
    }

    private void addAddonPricingIfEmpty(Service service, BigDecimal price) {
        if (!pricingRepository.findByServiceId(service.getId()).isEmpty())
            return;
        savePricing(service, "Default", null, null, price, 0);
        log.info("✅ Added addon pricing for service: {}", service.getServiceName());
    }

    private void addFleaPricingIfEmpty(Service service, BigDecimal laborPrice, BigDecimal packagePrice) {
        if (!pricingRepository.findByServiceId(service.getId()).isEmpty())
            return;
        savePricing(service, "Labor", null, null, laborPrice, 1);
        savePricing(service, "Package", null, null, packagePrice, 2);
        log.info("✅ Added flea pricing for service: {}", service.getServiceName());
    }

    private void savePricing(Service service, String pricingName, BigDecimal minWeight, BigDecimal maxWeight,
            BigDecimal price, int priority) {
        ServicePricing p = ServicePricing.builder()
                .service(service)
                .pricingName(pricingName)
                .minWeight(minWeight)
                .maxWeight(maxWeight)
                .price(price)
                .priority(priority)
                // By default, inherit all pet types from parent Service (DOG & CAT)
                .suitablePetTypes(service.getSuitablePetTypes() == null ? null
                        : String.join(",", service.getSuitablePetTypes().stream().map(Enum::name).toList()))
                .isActive(true)
                .isDeleted(false)
                .build();
        pricingRepository.save(p);
    }

    private void initCombos() {
        Service tamVeSinh = serviceRepository.findByCode("SPA-TAM-VE-SINH").orElse(null);
        Service veSinhTongQuat = serviceRepository.findByCode("SPA-VE-SINH-TONG-QUAT").orElse(null);
        Service phongChuong = serviceRepository.findByCode("HOTEL-PHONG-CHUONG").orElse(null);
        if (tamVeSinh == null || veSinhTongQuat == null || phongChuong == null) {
            log.warn("Cannot create combos: required services missing");
            return;
        }

        // Spa cơ bản: Tắm vệ sinh + Vệ sinh tổng quát
        if (!comboRepository.existsByCode("COMBO-SPA-CO-BAN")) {
            BigDecimal sum = new BigDecimal("190000"); // 125k + 65k approx
            BigDecimal comboPrice = new BigDecimal("175000");
            ServiceCombo combo = ServiceCombo.builder()
                    .code("COMBO-SPA-CO-BAN")
                    .comboName("Spa cơ bản")
                    .description("Tắm vệ sinh + Vệ sinh tổng quát")
                    .comboPrice(comboPrice)
                    .originalPrice(sum)
                    .validFrom(null)
                    .validTo(null)
                    .displayOrder(1)
                    .isPopular(true)
                    .isActive(true)
                    .isDeleted(false)
                    .build();
            combo = comboRepository.save(combo);
            comboServiceRepository.save(ServiceComboService.builder()
                    .id(ServiceComboServiceId.builder().serviceComboId(combo.getId()).serviceId(tamVeSinh.getId())
                            .build())
                    .quantity(1)
                    .build());
            comboServiceRepository.save(ServiceComboService.builder()
                    .id(ServiceComboServiceId.builder().serviceComboId(combo.getId()).serviceId(veSinhTongQuat.getId())
                            .build())
                    .quantity(1)
                    .build());
            log.info("✅ Created combo: Spa cơ bản");
        }

        // Gói lưu trú 1 ngày: Phòng Chuồng
        if (!comboRepository.existsByCode("COMBO-LUU-TRU-1-NGAY")) {
            BigDecimal price = new BigDecimal("125000");
            ServiceCombo combo = ServiceCombo.builder()
                    .code("COMBO-LUU-TRU-1-NGAY")
                    .comboName("Gói lưu trú 1 ngày")
                    .description("Lưu trú 1 ngày - Phòng Chuồng (giá band S)")
                    .comboPrice(price)
                    .originalPrice(price)
                    .validFrom(null)
                    .validTo(null)
                    .displayOrder(2)
                    .isPopular(false)
                    .build();
            combo = comboRepository.save(combo);
            comboServiceRepository.save(ServiceComboService.builder()
                    .id(ServiceComboServiceId.builder().serviceComboId(combo.getId()).serviceId(phongChuong.getId())
                            .build())
                    .quantity(1)
                    .build());
            log.info("✅ Created combo: Gói lưu trú 1 ngày");
        }
    }
}
