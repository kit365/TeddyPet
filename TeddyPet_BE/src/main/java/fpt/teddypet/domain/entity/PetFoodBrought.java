package fpt.teddypet.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "pet_food_brought")
@EqualsAndHashCode(callSuper = true)
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class PetFoodBrought extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_pet_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private BookingPet bookingPet;

    @Column(name = "food_brought_type", length = 50)
    private String foodBroughtType;

    @Column(name = "food_brand", length = 255)
    private String foodBrand;

    @Column(name = "quantity")
    private Integer quantity;

    @Column(name = "feeding_instructions", columnDefinition = "TEXT")
    private String feedingInstructions;
}

