package fpt.teddypet.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "amenities")
@EqualsAndHashCode(callSuper = true)
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Amenity extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private AmenityCategory category;

    @Column(name = "service_category_id")
    private Long serviceCategoryId;

    @Column(length = 500)
    private String description;

    @Column(length = 255)
    private String icon;

    @Column(length = 255)
    private String image;

    @Column(name = "display_order")
    @Builder.Default
    private Integer displayOrder = 0;
}
