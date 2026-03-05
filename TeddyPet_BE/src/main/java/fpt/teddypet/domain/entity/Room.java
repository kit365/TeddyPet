package fpt.teddypet.domain.entity;

import fpt.teddypet.domain.enums.RoomStatusEnum;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;

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

    @Column(name = "room_number", length = 50)
    private String roomNumber;

    @Column(name = "room_name", length = 255)
    private String roomName;

    @Column(name = "tier", length = 50)
    private String tier;

    @Column(name = "grid_row")
    private Integer gridRow;

    @Column(name = "grid_col")
    private Integer gridCol;

    @Column(name = "is_sorted", nullable = false)
    @Builder.Default
    private Boolean isSorted = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_layout_config_id")
    private RoomLayoutConfig roomLayoutConfig;

    @Column(name = "additional_amenities", columnDefinition = "TEXT")
    private String additionalAmenities;

    @Column(name = "removed_amenities", columnDefinition = "TEXT")
    private String removedAmenities;

    @Column(name = "images", columnDefinition = "TEXT")
    private String images;

    @Column(name = "capacity")
    private Integer capacity;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "area", precision = 10, scale = 2)
    private BigDecimal area;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private RoomStatusEnum status = RoomStatusEnum.AVAILABLE;
}
