package fpt.teddypet.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;
import java.util.Objects;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceRoomTypeId implements Serializable {

    @Column(name = "service_id", nullable = false)
    private Long serviceId;

    @Column(name = "room_type_id", nullable = false)
    private Long roomTypeId;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ServiceRoomTypeId that = (ServiceRoomTypeId) o;
        return Objects.equals(serviceId, that.serviceId) && Objects.equals(roomTypeId, that.roomTypeId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(serviceId, roomTypeId);
    }
}
