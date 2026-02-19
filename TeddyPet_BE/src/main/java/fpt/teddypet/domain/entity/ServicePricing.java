package fpt.teddypet.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "service_pricing")
@EqualsAndHashCode(callSuper = true)
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class ServicePricing extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id", nullable = false)
    private Service service;

    @Column(name = "suitable_pet_types", columnDefinition = "TEXT")
    private String suitablePetTypes;

    @Column(name = "pricing_name", nullable = false, length = 255)
    private String pricingName;

    @Column(name = "price", nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @Column(name = "weekend_multiplier", precision = 5, scale = 2)
    private BigDecimal weekendMultiplier;

    @Column(name = "peak_season_multiplier", precision = 5, scale = 2)
    private BigDecimal peakSeasonMultiplier;

    @Column(name = "holiday_multiplier", precision = 5, scale = 2)
    private BigDecimal holidayMultiplier;

    @Column(name = "min_weight", precision = 6, scale = 2)
    private BigDecimal minWeight;

    @Column(name = "max_weight", precision = 6, scale = 2)
    private BigDecimal maxWeight;

    @Column(name = "effective_from")
    private LocalDateTime effectiveFrom;

    @Column(name = "effective_to")
    private LocalDateTime effectiveTo;

    @Column(name = "priority", nullable = false)
    @Builder.Default
    private Integer priority = 0;
}
