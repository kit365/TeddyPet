package fpt.teddypet.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "booking_pets")
@EqualsAndHashCode(callSuper = true)
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class BookingPet extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Booking booking;

    @Column(name = "pet_profile_id")
    private Long petProfileId;

    @Column(name = "pet_name", length = 255)
    private String petName;

    @Column(name = "pet_type", length = 100)
    private String petType;

    @Column(name = "emergency_contact_name", length = 255)
    private String emergencyContactName;

    @Column(name = "emergency_contact_phone", length = 20)
    private String emergencyContactPhone;

    @Column(name = "weight_at_booking", precision = 6, scale = 2)
    private BigDecimal weightAtBooking;

    @Column(name = "confirmed_pet_type", length = 100)
    private String confirmedPetType;

    @Column(name = "confirmed_weight", precision = 6, scale = 2)
    private BigDecimal confirmedWeight;

    @Column(name = "pet_condition_notes", columnDefinition = "TEXT")
    private String petConditionNotes;

    @Column(name = "health_issues", columnDefinition = "TEXT")
    private String healthIssues;

    @Column(name = "arrival_condition", columnDefinition = "TEXT")
    private String arrivalCondition;

    @Column(name = "departure_condition", columnDefinition = "TEXT")
    private String departureCondition;

    @Column(name = "arrival_photos", columnDefinition = "TEXT")
    private String arrivalPhotos;

    @Column(name = "departure_photos", columnDefinition = "TEXT")
    private String departurePhotos;

    @Column(name = "belonging_photos", columnDefinition = "TEXT")
    private String belongingPhotos;

    @Column(name = "status", length = 50)
    private String status;

    @OneToMany(mappedBy = "bookingPet", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<BookingPetService> services = new ArrayList<>();

    @Column(name = "food_brought", columnDefinition = "TEXT")
    private String foodBrought;

    @OneToMany(mappedBy = "bookingPet", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PetFoodBrought> foodItems = new ArrayList<>();
}
