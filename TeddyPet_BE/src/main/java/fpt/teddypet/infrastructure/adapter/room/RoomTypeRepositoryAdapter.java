package fpt.teddypet.infrastructure.adapter.room;

import fpt.teddypet.application.port.output.room.RoomTypeRepositoryPort;
import fpt.teddypet.domain.entity.RoomType;
import fpt.teddypet.infrastructure.persistence.postgres.repository.room.RoomTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class RoomTypeRepositoryAdapter implements RoomTypeRepositoryPort {

    private final RoomTypeRepository roomTypeRepository;

    @Override
    public RoomType save(RoomType roomType) {
        return roomTypeRepository.save(roomType);
    }

    @Override
    public Optional<RoomType> findById(Long id) {
        return roomTypeRepository.findByIdAndIsDeletedFalse(id);
    }

    @Override
    public List<RoomType> findAllActive() {
        return roomTypeRepository.findByIsActiveTrueAndIsDeletedFalseOrderByDisplayOrderAsc();
    }

    @Override
    public List<RoomType> findByServiceId(Long serviceId) {
        if (serviceId == null) {
            return findAllActive();
        }
        return roomTypeRepository.findByServiceIdAndIsActiveTrueAndIsDeletedFalseOrderByDisplayOrderAsc(serviceId);
    }

    @Override
    public boolean existsBySlug(String slug) {
        return roomTypeRepository.existsBySlug(slug);
    }

    @Override
    public boolean existsBySlugAndIdNot(String slug, Long id) {
        return roomTypeRepository.existsBySlugAndIdNot(slug, id);
    }
}
