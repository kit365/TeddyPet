package fpt.teddypet.infrastructure.adapter.room;

import fpt.teddypet.application.port.output.room.RoomLayoutConfigRepositoryPort;
import fpt.teddypet.domain.entity.RoomLayoutConfig;
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
    public void deleteById(Long id) {
        repository.deleteById(id);
    }
}
