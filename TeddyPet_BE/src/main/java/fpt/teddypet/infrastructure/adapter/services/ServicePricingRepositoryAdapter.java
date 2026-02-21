package fpt.teddypet.infrastructure.adapter.services;

import fpt.teddypet.application.port.output.services.ServicePricingRepositoryPort;
import fpt.teddypet.domain.entity.ServicePricing;
import fpt.teddypet.infrastructure.persistence.postgres.repository.services.ServicePricingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class ServicePricingRepositoryAdapter implements ServicePricingRepositoryPort {

    private final ServicePricingRepository servicePricingRepository;

    @Override
    public ServicePricing save(ServicePricing servicePricing) {
        return servicePricingRepository.save(servicePricing);
    }

    @Override
    public Optional<ServicePricing> findById(Long id) {
        return servicePricingRepository.findById(id);
    }

    @Override
    public List<ServicePricing> findByServiceId(Long serviceId) {
        return servicePricingRepository.findByServiceId(serviceId);
    }

    @Override
    public List<ServicePricing> findByServiceIdAndActive(Long serviceId, boolean active) {
        return active
                ? servicePricingRepository.findByServiceIdAndIsActiveTrueAndIsDeletedFalse(serviceId)
                : servicePricingRepository.findByServiceId(serviceId);
    }

    @Override
    public void delete(ServicePricing servicePricing) {
        servicePricingRepository.delete(servicePricing);
    }

    @Override
    public void deleteByServiceId(Long serviceId) {
        servicePricingRepository.deleteByService_Id(serviceId);
    }
}
