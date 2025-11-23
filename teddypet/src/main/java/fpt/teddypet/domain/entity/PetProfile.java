package fpt.teddypet.domain.entity;

import fpt.teddypet.domain.enums.GenderEnum;
import fpt.teddypet.domain.enums.PetTypeEnum;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "pet_profiles")
@EqualsAndHashCode(callSuper = true)
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class PetProfile extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "pet_type", nullable = false, length = 50)
    private PetTypeEnum petType; // DOG, CAT, BIRD, etc.

    @Column(length = 100)
    private String breed;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private GenderEnum gender;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    @Column(precision = 5, scale = 2) // e.g., 999.99 kg
    private BigDecimal weight;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Column(name = "alt_image", length = 255)
    private String altImage;

    @Column(name = "is_neutered")
    private Boolean isNeutered;

    @Column(name = "health_note", columnDefinition = "TEXT")
    private String healthNote;

    // Optional FK to AvatarImage
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "avatar_image_id")
    private AvatarImage avatarImage;
}
