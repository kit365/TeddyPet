package fpt.teddypet.infrastructure.adapter.room;

import fpt.teddypet.application.port.output.room.ServiceRoomTypeRepositoryPort;
import fpt.teddypet.domain.entity.ServiceRoomType;
import fpt.teddypet.domain.entity.ServiceRoomTypeId;
import fpt.teddypet.infrastructure.persistence.postgres.repository.room.ServiceRoomTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class ServiceRoomTypeRepositoryAdapter implements ServiceRoomTypeRepositoryPort {

    private final ServiceRoomTypeRepository repository;

    @Override
    public List<Long> findRoomTypeIdsByServiceId(Long serviceId) {
        return repository.findRoomTypeIdsByServiceId(serviceId);
    }

    @Override
    public List<Long> findServiceIdsByRoomTypeId(Long roomTypeId) {
        return repository.findServiceIdsByRoomTypeId(roomTypeId);
    }

    @Override
    public void deleteByServiceId(Long serviceId) {
        repository.deleteByServiceId(serviceId);
    }

    @Override
    public void setRoomTypesForService(Long serviceId, List<Long> roomTypeIds) {
        repository.deleteByServiceId(serviceId);
        if (roomTypeIds != null && !roomTypeIds.isEmpty()) {
            for (Long roomTypeId : roomTypeIds) {
                repository.save(ServiceRoomType.builder()
                        .id(ServiceRoomTypeId.builder().serviceId(serviceId).roomTypeId(roomTypeId).build())
                        .build());
            }
        }
    }
}
