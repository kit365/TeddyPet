package fpt.teddypet.infrastructure.adapter.room;

import fpt.teddypet.application.port.output.room.RoomLayoutConfigRepositoryPort;
import fpt.teddypet.domain.entity.RoomLayoutConfig;
import fpt.teddypet.domain.enums.RoomLayoutStatusEnum;
import fpt.teddypet.infrastructure.persistence.postgres.repository.room.RoomLayoutConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class RoomLayoutConfigRepositoryAdapter implements RoomLayoutConfigRepositoryPort {

    private final RoomLayoutConfigRepository repository;

    @Override
    public RoomLayoutConfig save(RoomLayoutConfig entity) {
        return repository.save(entity);
    }

    @Override
    public Optional<RoomLayoutConfig> findById(Long id) {
        return repository.findById(id);
    }

    @Override
    public List<RoomLayoutConfig> findAll() {
        return repository.findAllByOrderByIdAsc();
    }

    @Override
    public List<RoomLayoutConfig> findByServiceId(Long serviceId) {
        if (serviceId == null) {
            return findAll();
        }
        return repository.findByService_IdOrderByIdAsc(serviceId);
    }

    @Override
    public List<RoomLayoutConfig> findByServiceIdAndStatus(Long serviceId, RoomLayoutStatusEnum status) {
        if (serviceId == null) {
            return findAll();
        }
        if (status == null) {
            return repository.findByService_IdOrderByIdAsc(serviceId);
        }
        return repository.findByService_IdAndStatusOrderByIdAsc(serviceId, status);
    }

    @Override
    public void deleteById(Long id) {
        repository.deleteById(id);
    }
}
