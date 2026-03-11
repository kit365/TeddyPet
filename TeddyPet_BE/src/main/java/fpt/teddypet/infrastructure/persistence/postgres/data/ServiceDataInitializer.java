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
import java.util.List;

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
        Service chamSocDacBiet = createServiceIfNotExists(hotelCat, "ADDON-HOTEL-CHAM-SOC-DAC-BIET",
                "Chăm sóc đặc biệt",
                "Chăm sóc y tế/đặc biệt theo yêu cầu (giá theo thỏa thuận)", 30, new BigDecimal("50000"), "lần", true,
                2, false);
        addAddonPricingIfEmpty(buaAnThem, new BigDecimal("30000"));
        addAddonPricingIfEmpty(chamSocDacBiet, new BigDecimal("50000"));
    }

    /**
     * Seed dịch vụ Additional charge (isAdditionalCharge=true) — nhân viên thêm vào
     * booking_pet_service khi phát sinh.
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
                .cancellationDeadlineHours(12)
                .maxPetsPerSession(1)
                .requiredStaffCount(1)
                .basePrice(basePrice != null ? basePrice : BigDecimal.ZERO)
                .priceUnit("lần")
                .isAddon(false)
                .isAdditionalCharge(true)
                .isRequiredRoom(false)
                .displayOrder(100)
                .suitablePetTypes(Arrays.asList(PetTypeEnum.DOG, PetTypeEnum.CAT))
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
                .cancellationDeadlineHours(12)
                .maxPetsPerSession(1)
                .requiredStaffCount(1)
                .basePrice(basePrice)
                .priceUnit(priceUnit)
                .isAddon(isAddon)
                .isRequiredRoom(isRequiredRoom)
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
                .displayOrder(displayOrder)
                .suitablePetTypes(Arrays.asList(PetTypeEnum.DOG, PetTypeEnum.CAT))
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
