package fpt.teddypet.application.port.output.room;

import fpt.teddypet.domain.entity.RoomLayoutConfig;

import java.util.List;
import java.util.Optional;

public interface RoomLayoutConfigRepositoryPort {

    RoomLayoutConfig save(RoomLayoutConfig entity);

    Optional<RoomLayoutConfig> findById(Long id);

    List<RoomLayoutConfig> findAll();

    void deleteById(Long id);
}
