package fpt.teddypet.application.port.output.services;

import fpt.teddypet.domain.entity.ServicePricing;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface ServicePricingRepositoryPort {

    ServicePricing save(ServicePricing servicePricing);

    Optional<ServicePricing> findById(Long id);

    List<ServicePricing> findByServiceId(Long serviceId);

    List<ServicePricing> findByServiceIdAndActive(Long serviceId, boolean active);

    /** Minimum active price for the service (from service_pricing). Empty if no active pricing. */
    Optional<BigDecimal> findMinActivePriceByServiceId(Long serviceId);

    void delete(ServicePricing servicePricing);

    void deleteByServiceId(Long serviceId);
}
