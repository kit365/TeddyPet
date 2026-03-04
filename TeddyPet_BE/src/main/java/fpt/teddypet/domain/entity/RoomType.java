package fpt.teddypet.domain.entity;

import fpt.teddypet.domain.converter.StringListJsonConverter;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "room_types")
@EqualsAndHashCode(callSuper = true)
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class RoomType extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id")
    private Service service;

    @Column(name = "type_name", nullable = false, length = 255)
    private String typeName;

    @Column(name = "display_type_name", length = 255)
    private String displayTypeName;

    @Column(unique = true, length = 255)
    private String slug;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "short_description", length = 500)
    private String shortDescription;

    @Column(name = "image_url", length = 255)
    private String imageUrl;

    @Convert(converter = StringListJsonConverter.class)
    @Column(name = "gallery_images", columnDefinition = "TEXT")
    private List<String> galleryImages;

    @Column(name = "min_area", precision = 10, scale = 2)
    private BigDecimal minArea;

    @Column(name = "max_area", precision = 10, scale = 2)
    private BigDecimal maxArea;

    @Column(name = "max_pets")
    private Integer maxPets;

    @Column(name = "min_pet_weight", precision = 10, scale = 2)
    private BigDecimal minPetWeight;

    @Column(name = "max_pet_weight", precision = 10, scale = 2)
    private BigDecimal maxPetWeight;

    @Column(name = "suitable_pet_sizes", length = 500)
    private String suitablePetSizes;

    @Convert(converter = StringListJsonConverter.class)
    @Column(name = "suitable_pet_types", columnDefinition = "TEXT")
    private List<String> suitablePetTypes;

    @Column(name = "base_price_per_night", precision = 12, scale = 2)
    private BigDecimal basePricePerNight;

    @Column(name = "standard_amenities", columnDefinition = "TEXT")
    private String standardAmenities;

    @Column(name = "features", columnDefinition = "TEXT")
    private String features;

    @Column(name = "display_order")
    @Builder.Default
    private Integer displayOrder = 0;

    @Column(name = "cancellation_policy", columnDefinition = "TEXT")
    private String cancellationPolicy;

    @Column(name = "requires_vaccination", nullable = false)
    @Builder.Default
    private Boolean requiresVaccination = true;

    @Column(name = "requires_health_check", nullable = false)
    @Builder.Default
    private Boolean requiresHealthCheck = false;

    @Column(name = "total_rooms")
    private Integer totalRooms;

    @Column(name = "meta_title", length = 150)
    private String metaTitle;

    @Column(name = "meta_description", length = 255)
    private String metaDescription;

    @Column(name = "keywords", columnDefinition = "TEXT")
    private String keywords;

    @OneToMany(mappedBy = "roomType", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Room> rooms = new ArrayList<>();
}
