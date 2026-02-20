package fpt.teddypet.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
@Builder
public class ServiceComboServiceId implements Serializable {

    private static final long serialVersionUID = 1L;

    @Column(name = "service_combo_id", nullable = false)
    private Long serviceComboId;

    @Column(name = "service_id", nullable = false)
    private Long serviceId;
}
