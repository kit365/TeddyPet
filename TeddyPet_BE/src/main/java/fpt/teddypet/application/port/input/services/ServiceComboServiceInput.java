package fpt.teddypet.application.port.input.services;

import fpt.teddypet.application.dto.request.services.combo.ServiceComboUpsertRequest;
import fpt.teddypet.application.dto.response.service.combo.ServiceComboDetailResponse;
import fpt.teddypet.application.dto.response.service.combo.ServiceComboResponse;
import fpt.teddypet.domain.entity.ServiceCombo;

import java.util.List;

public interface ServiceComboServiceInput {

    void upsert(ServiceComboUpsertRequest request);

    ServiceComboDetailResponse getDetail(Long id);

    ServiceCombo getById(Long id);

    List<ServiceComboResponse> getAll();

    List<ServiceComboDetailResponse> getAllWithDetails();

    void delete(Long id);
}
