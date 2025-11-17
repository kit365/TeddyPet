package fpt.teddypet.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "age_ranges")
@EqualsAndHashCode(callSuper = true)
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class AgeRange extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String name; // Ví dụ: "ALL", "PUPPY", "ADULT", "SENIOR"

    @Column(length = 255)
    private String description; // Ví dụ: "Mọi lứa tuổi", "Chó con", "Trưởng thành"


    @ManyToMany(mappedBy = "ageRanges", fetch = FetchType.LAZY)
    @Builder.Default
    private List<Product> products = new ArrayList<>();
}

