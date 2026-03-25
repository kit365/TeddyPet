package fpt.teddypet.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import fpt.teddypet.domain.entity.staff.StaffProfile;

@Entity
@Table(name = "booking_pet_services")
@EqualsAndHashCode(callSuper = true)
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class BookingPetService extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_pet_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private BookingPet bookingPet;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "booking_pet_service_staff",
            joinColumns = @JoinColumn(name = "booking_pet_service_id"),
            inverseJoinColumns = @JoinColumn(name = "staff_id")
    )
    @Builder.Default
    private Set<StaffProfile> assignedStaff = new HashSet<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Service service;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_combo_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private ServiceCombo serviceCombo;

    @Column(name = "time_slot_id")
    private Long timeSlotId;

    @Column(name = "room_id")
    private Long roomId;

    @Column(name = "during_photos", columnDefinition = "TEXT")
    private String duringPhotos;

    @Column(name = "after_photos", columnDefinition = "TEXT")
    private String afterPhotos;

    @Column(name = "before_photos", columnDefinition = "TEXT")
    private String beforePhotos;

    @Column(name = "videos", columnDefinition = "TEXT")
    private String videos;

    @Column(name = "estimated_check_in_date")
    private LocalDate estimatedCheckInDate;

    @Column(name = "estimated_check_out_date")
    private LocalDate estimatedCheckOutDate;

    @Column(name = "actual_check_in_date")
    private LocalDate actualCheckInDate;

    @Column(name = "actual_check_out_date")
    private LocalDate actualCheckOutDate;

    @Column(name = "number_of_nights")
    private Integer numberOfNights;

    @Column(name = "scheduled_start_time")
    private LocalDateTime scheduledStartTime;

    @Column(name = "scheduled_end_time")
    private LocalDateTime scheduledEndTime;

    @Column(name = "actual_start_time")
    private LocalDateTime actualStartTime;

    @Column(name = "actual_end_time")
    private LocalDateTime actualEndTime;

    @Column(name = "base_price", precision = 12, scale = 2)
    private BigDecimal basePrice;

    @Column(name = "paid_amount", precision = 12, scale = 2)
    private BigDecimal paidAmount;

    @Column(name = "subtotal", precision = 12, scale = 2)
    private BigDecimal subtotal;

    @Column(name = "status", length = 50)
    private String status;

    @Column(name = "cancelled_reason", columnDefinition = "TEXT")
    private String cancelledReason;

    @Column(name = "cancelled_by", length = 255)
    private String cancelledBy;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "staff_notes", columnDefinition = "TEXT")
    private String staffNotes;

    @Column(name = "customer_rating")
    private Integer customerRating;

    @Column(name = "customer_review", columnDefinition = "TEXT")
    private String customerReview;

    @OneToMany(mappedBy = "bookingPetService", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<BookingPetServiceItem> items = new ArrayList<>();
}
