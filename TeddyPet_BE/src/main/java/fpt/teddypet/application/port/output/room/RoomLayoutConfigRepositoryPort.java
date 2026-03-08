package fpt.teddypet.application.port.output.room;

import fpt.teddypet.domain.entity.RoomLayoutConfig;
import fpt.teddypet.domain.enums.RoomLayoutStatusEnum;

import java.util.List;
import java.util.Optional;

public interface RoomLayoutConfigRepositoryPort {

    RoomLayoutConfig save(RoomLayoutConfig entity);

    Optional<RoomLayoutConfig> findById(Long id);

    List<RoomLayoutConfig> findAll();

    List<RoomLayoutConfig> findByServiceId(Long serviceId);

    List<RoomLayoutConfig> findByServiceIdAndStatus(Long serviceId, RoomLayoutStatusEnum status);

    void deleteById(Long id);
}
