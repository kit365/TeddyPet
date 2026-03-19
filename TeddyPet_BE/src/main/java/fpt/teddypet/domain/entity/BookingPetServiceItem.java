package fpt.teddypet.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;

/**
 * Add-on hoặc additional charge gắn với một booking_pet_service.
 * itemType = ADDON (khách chọn, dịch vụ isAddon=true) hoặc CHARGE (nhân viên thêm, dịch vụ isAdditionalCharge=true).
 */
@Entity
@Table(name = "booking_pet_service_items")
@EqualsAndHashCode(callSuper = true)
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class BookingPetServiceItem extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_pet_service_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private BookingPetService bookingPetService;

    @Column(name = "parent_service_id", nullable = false)
    private Long parentServiceId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_service_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Service itemService;

    @Column(name = "item_type", nullable = false, length = 50)
    private String itemType; // ADDON | CHARGE

    @Column(name = "charge_reason", columnDefinition = "TEXT")
    private String chargeReason;

    @Column(name = "charge_evidence", columnDefinition = "TEXT")
    private String chargeEvidence;

    @Column(name = "charged_by", length = 255)
    private String chargedBy;

    @Column(name = "charge_approved_by", length = 255)
    private String chargeApprovedBy;

    @Column(name = "charge_approved_at")
    private LocalDateTime chargeApprovedAt;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "staff_notes", columnDefinition = "TEXT")
    private String staffNotes;

    @Column(name = "cancelled_reason", columnDefinition = "TEXT")
    private String cancelledReason;

    @Column(name = "cancelled_by", length = 255)
    private String cancelledBy;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;
}
