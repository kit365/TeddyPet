package fpt.teddypet.application.port.output.room;

import fpt.teddypet.domain.entity.RoomType;

import java.util.List;
import java.util.Optional;

public interface RoomTypeRepositoryPort {

    RoomType save(RoomType roomType);

    Optional<RoomType> findById(Long id);

    List<RoomType> findAllActive();

    List<RoomType> findByServiceId(Long serviceId);

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, Long id);
}
