package fpt.teddypet.domain.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "service_combo_service")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode
public class ServiceComboService {

    @EmbeddedId
    private ServiceComboServiceId id;

    @Column(nullable = false)
    @Builder.Default
    private Integer quantity = 1;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_combo_id", nullable = false, insertable = false, updatable = false)
    private ServiceCombo serviceCombo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id", nullable = false, insertable = false, updatable = false)
    private Service service;
}
