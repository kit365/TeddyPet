package fpt.teddypet.domain.entity;

import fpt.teddypet.domain.enums.RoomStatusEnum;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "rooms")
@EqualsAndHashCode(callSuper = true)
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Room extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_type_id", nullable = false)
    private RoomType roomType;

    @Column(name = "room_number", nullable = false, length = 50)
    private String roomNumber;

    @Column(name = "room_name", length = 255)
    private String roomName;

    @Column(name = "building", length = 100)
    private String building;

    @Column(name = "floor", length = 50)
    private String floor;

    @Column(name = "location_note", length = 500)
    private String locationNote;

    @Column(name = "custom_price_per_night", precision = 12, scale = 2)
    private BigDecimal customPricePerNight;

    @Column(name = "price_note", length = 500)
    private String priceNote;

    @Column(name = "additional_amenities", columnDefinition = "TEXT")
    private String additionalAmenities;

    @Column(name = "removed_amenities", columnDefinition = "TEXT")
    private String removedAmenities;

    @Column(name = "images", columnDefinition = "TEXT")
    private String images;

    @Column(name = "capacity")
    private Integer capacity;

    @Column(name = "expected_checkout_date")
    private LocalDate expectedCheckoutDate;

    @Column(name = "current_check_in_date")
    private LocalDate currentCheckInDate;

    @Column(name = "last_cleaned_at")
    private LocalDateTime lastCleanedAt;

    @Column(name = "last_maintenance_at")
    private LocalDateTime lastMaintenanceAt;

    @Column(name = "maintenance_notes", columnDefinition = "TEXT")
    private String maintenanceNotes;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "internal_notes", columnDefinition = "TEXT")
    private String internalNotes;

    @Column(name = "area", precision = 10, scale = 2)
    private BigDecimal area;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private RoomStatusEnum status = RoomStatusEnum.AVAILABLE;

    @Column(name = "is_available_for_booking", nullable = false)
    @Builder.Default
    private Boolean isAvailableForBooking = true;

    @Column(name = "is_blocked", nullable = false)
    @Builder.Default
    private Boolean isBlocked = false;

    @Column(name = "block_reason", columnDefinition = "TEXT")
    private String blockReason;

    @Column(name = "blocked_from")
    private LocalDateTime blockedFrom;

    @Column(name = "blocked_to")
    private LocalDateTime blockedTo;

    @Column(name = "blocked_by", length = 255)
    private String blockedBy;
}
