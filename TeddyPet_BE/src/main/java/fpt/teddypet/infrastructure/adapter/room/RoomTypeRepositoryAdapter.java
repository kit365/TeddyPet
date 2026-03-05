package fpt.teddypet.infrastructure.adapter.room;

import fpt.teddypet.application.port.output.room.RoomTypeRepositoryPort;
import fpt.teddypet.domain.entity.RoomType;
import fpt.teddypet.infrastructure.persistence.postgres.repository.room.RoomTypeRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.room.ServiceRoomTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class RoomTypeRepositoryAdapter implements RoomTypeRepositoryPort {

    private final RoomTypeRepository roomTypeRepository;
    private final ServiceRoomTypeRepository serviceRoomTypeRepository;

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
        List<Long> roomTypeIds = serviceRoomTypeRepository.findRoomTypeIdsByServiceId(serviceId);
        if (roomTypeIds.isEmpty()) {
            return Collections.emptyList();
        }
        return roomTypeRepository.findAllById(roomTypeIds).stream()
                .filter(rt -> rt.isActive() && !rt.isDeleted())
                .sorted((a, b) -> Integer.compare(
                        a.getDisplayOrder() != null ? a.getDisplayOrder() : 0,
                        b.getDisplayOrder() != null ? b.getDisplayOrder() : 0
                ))
                .toList();
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
