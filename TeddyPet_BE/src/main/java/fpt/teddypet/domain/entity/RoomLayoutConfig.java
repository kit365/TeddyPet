package fpt.teddypet.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "room_layout_config")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomLayoutConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "layout_name", length = 255)
    private String layoutName;

    @Column(name = "block", length = 100)
    private String block;

    @Column(name = "max_rows", nullable = false)
    private Integer maxRows;

    @Column(name = "max_cols", nullable = false)
    private Integer maxCols;

    @Column(name = "floor", length = 50)
    private String floor;

    @Column(name = "background_image", length = 500)
    private String backgroundImage;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
