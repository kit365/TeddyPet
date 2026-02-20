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

    List<ServiceResponse> getByCategoryId(Long categoryId);

    void delete(Long id);

    ServiceInfo toInfo(Service service);

    List<ServiceInfo> toInfos(List<Service> services);
}
