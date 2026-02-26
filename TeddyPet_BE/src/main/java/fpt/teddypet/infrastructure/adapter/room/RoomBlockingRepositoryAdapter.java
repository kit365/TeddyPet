package fpt.teddypet.infrastructure.adapter.room;

import fpt.teddypet.application.port.output.room.RoomBlockingRepositoryPort;
import fpt.teddypet.domain.entity.RoomBlocking;
import fpt.teddypet.infrastructure.persistence.postgres.repository.room.RoomBlockingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class RoomBlockingRepositoryAdapter implements RoomBlockingRepositoryPort {

    private final RoomBlockingRepository roomBlockingRepository;

    @Override
    public RoomBlocking save(RoomBlocking blocking) {
        return roomBlockingRepository.save(blocking);
    }
}
