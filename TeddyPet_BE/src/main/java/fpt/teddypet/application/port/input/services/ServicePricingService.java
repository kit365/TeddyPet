package fpt.teddypet.application.port.input.services;

import fpt.teddypet.application.dto.request.services.pricing.ServicePricingUpsertRequest;
import fpt.teddypet.application.dto.response.service.pricing.ServicePricingInfo;
import fpt.teddypet.application.dto.response.service.pricing.ServicePricingResponse;
import fpt.teddypet.domain.entity.ServicePricing;

import java.util.List;

public interface ServicePricingService {

    void upsert(ServicePricingUpsertRequest request);

    ServicePricingResponse getDetail(Long id);

    ServicePricing getById(Long id);

    List<ServicePricingResponse> getByServiceId(Long serviceId);

    void delete(Long id);
}
