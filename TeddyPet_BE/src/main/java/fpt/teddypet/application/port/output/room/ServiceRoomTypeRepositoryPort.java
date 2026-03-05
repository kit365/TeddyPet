package fpt.teddypet.application.port.output.room;

import java.util.List;

public interface ServiceRoomTypeRepositoryPort {

    List<Long> findRoomTypeIdsByServiceId(Long serviceId);

    List<Long> findServiceIdsByRoomTypeId(Long roomTypeId);

    void deleteByServiceId(Long serviceId);

    void setRoomTypesForService(Long serviceId, List<Long> roomTypeIds);
}
