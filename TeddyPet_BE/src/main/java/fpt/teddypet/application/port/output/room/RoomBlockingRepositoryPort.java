package fpt.teddypet.application.port.output.room;

import fpt.teddypet.domain.entity.RoomBlocking;

public interface RoomBlockingRepositoryPort {

    RoomBlocking save(RoomBlocking blocking);
}
