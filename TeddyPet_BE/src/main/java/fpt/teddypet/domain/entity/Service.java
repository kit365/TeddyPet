package fpt.teddypet.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import fpt.teddypet.domain.converter.PetTypeListJsonConverter;
import fpt.teddypet.domain.converter.StringListJsonConverter;
import fpt.teddypet.domain.enums.PetTypeEnum;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "services")
@EqualsAndHashCode(callSuper = true)
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Service extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_category_id", nullable = false)
    private ServiceCategory serviceCategory;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "service_name", nullable = false, length = 255)
    private String serviceName;

    @Column(name = "suitable_pet_types", columnDefinition = "TEXT")
    @Convert(converter = PetTypeListJsonConverter.class)
    private List<PetTypeEnum> suitablePetTypes;

    @Column(unique = true, length = 255)
    private String slug;

    @Column(name = "short_description", length = 500)
    private String shortDescription;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private Integer duration;

    @Column(name = "buffer_time", nullable = false)
    @Builder.Default
    private Integer bufferTime = 15;

    @Column(name = "base_price", precision = 12, scale = 2)
    private BigDecimal basePrice;

    @Column(name = "max_pets_per_session")
    private Integer maxPetsPerSession;

    @Column(name = "advance_booking_hours")
    @Builder.Default
    private Integer advanceBookingHours = 24;

    @Column(name = "cancellation_deadline_hours")
    private Integer cancellationDeadlineHours;

    @Column(name = "image_url", length = 255)
    private String imageURL;

    @Column(name = "gallery_images", columnDefinition = "TEXT")
    @Convert(converter = StringListJsonConverter.class)
    private List<String> galleryImages;

    @Column(name = "required_staff_count")
    private Integer requiredStaffCount;

    @Column(name = "required_certifications", columnDefinition = "TEXT")
    private String requiredCertifications;

    @Column(name = "requires_vaccination", nullable = false)
    @Builder.Default
    private Boolean requiresVaccination = false;

    @Column(name = "display_order")
    @Builder.Default
    private Integer displayOrder = 0;

    @Column(name = "is_popular", nullable = false)
    @Builder.Default
    private Boolean isPopular = false;

    @Column(name = "is_addon", nullable = false)
    @Builder.Default
    private Boolean isAddon = false;

    @Column(name = "is_additional_charge", nullable = false)
    @Builder.Default
    private Boolean isAdditionalCharge = false;

    @Column(name = "is_critical", nullable = false)
    @Builder.Default
    private Boolean isCritical = false;

    @Column(name = "addon_type", length = 50)
    private String addonType;

    @Column(name = "meta_title", length = 255)
    private String metaTitle;

    @Column(name = "meta_description", length = 500)
    private String metaDescription;

    @Column(name = "price_unit", length = 50)
    private String priceUnit;

    @Column(name = "is_required_room", nullable = false)
    @Builder.Default
    private Boolean isRequiredRoom = false;

    // ===== Refund Policy =====
    @Column(name = "before_deadline_refund_pct", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal beforeDeadlineRefundPct = new BigDecimal("100.00");

    @Column(name = "after_deadline_refund_pct", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal afterDeadlineRefundPct = new BigDecimal("50.00");

    @Column(name = "no_show_refund_pct", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal noShowRefundPct = new BigDecimal("0.00");

    @Column(name = "no_show_penalty", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal noShowPenalty = new BigDecimal("0.00");

    @Column(name = "allow_reschedule")
    @Builder.Default
    private Boolean allowReschedule = true;

    @Column(name = "reschedule_deadline_hours")
    @Builder.Default
    private Integer rescheduleDeadlineHours = 24;

    @Column(name = "reschedule_limit")
    @Builder.Default
    private Integer rescheduleLimit = 2;

    @Column(name = "allow_force_majeure")
    @Builder.Default
    private Boolean allowForceMajeure = true;

    @Column(name = "force_majeure_refund_pct", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal forceMajeureRefundPct = new BigDecimal("100.00");

    @OneToMany(mappedBy = "service", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ServiceComboService> comboItems = new ArrayList<>();

    @OneToMany(mappedBy = "service", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ServicePricing> pricingRules = new ArrayList<>();

    @OneToMany(mappedBy = "service", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<TimeSlot> timeSlots = new ArrayList<>();
}
