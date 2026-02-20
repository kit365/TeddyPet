package fpt.teddypet.application.port.output.services;

import fpt.teddypet.domain.entity.ServicePricing;

import java.util.List;
import java.util.Optional;

public interface ServicePricingRepositoryPort {

    ServicePricing save(ServicePricing servicePricing);

    Optional<ServicePricing> findById(Long id);

    List<ServicePricing> findByServiceId(Long serviceId);

    List<ServicePricing> findByServiceIdAndActive(Long serviceId, boolean active);

    void delete(ServicePricing servicePricing);

    void deleteByServiceId(Long serviceId);
}
