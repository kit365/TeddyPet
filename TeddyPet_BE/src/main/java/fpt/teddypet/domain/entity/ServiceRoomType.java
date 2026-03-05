package fpt.teddypet.domain.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Join entity for Service-RoomType many-to-many.
 * Holds only the composite key (serviceId, roomTypeId).
 */
@Entity
@Table(name = "service_room_types")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceRoomType {

    @EmbeddedId
    private ServiceRoomTypeId id;
}
