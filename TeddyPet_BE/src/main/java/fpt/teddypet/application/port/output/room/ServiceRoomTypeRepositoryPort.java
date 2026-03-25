package fpt.teddypet.application.port.output.room;

import java.util.List;

public interface ServiceRoomTypeRepositoryPort {

    List<Long> findRoomTypeIdsByServiceId(Long serviceId);

    List<Long> findServiceIdsByRoomTypeId(Long roomTypeId);

    boolean existsLink(Long serviceId, Long roomTypeId);

    void deleteByServiceId(Long serviceId);

    void deleteByRoomTypeId(Long roomTypeId);

    void addLink(Long serviceId, Long roomTypeId);

    void setRoomTypesForService(Long serviceId, List<Long> roomTypeIds);
}
