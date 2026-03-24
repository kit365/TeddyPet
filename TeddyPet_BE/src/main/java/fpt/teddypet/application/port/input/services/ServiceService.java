package fpt.teddypet.application.port.input.services;

import fpt.teddypet.application.dto.request.services.service.ServiceUpsertRequest;
import fpt.teddypet.application.dto.response.service.service.ServiceInfo;
import fpt.teddypet.application.dto.response.service.service.ServiceResponse;
import fpt.teddypet.domain.entity.Service;

import java.util.List;

public interface ServiceService {

    ServiceResponse upsert(ServiceUpsertRequest request);

    ServiceResponse getDetail(Long id);

    Service getById(Long id);

    List<ServiceResponse> getAll();

    /** @param isRequiredRoom if true, return only services with isRequiredRoom=true */
    List<ServiceResponse> getAll(Boolean isRequiredRoom);

    List<ServiceResponse> getByCategoryId(Long categoryId);

    void delete(Long id);

    /** Thay thế toàn bộ loại phòng gắn với dịch vụ (bảng service_room_types). */
    void setRoomTypesForService(Long serviceId, List<Long> roomTypeIds);

    ServiceInfo toInfo(Service service);

    List<ServiceInfo> toInfos(List<Service> services);
}
