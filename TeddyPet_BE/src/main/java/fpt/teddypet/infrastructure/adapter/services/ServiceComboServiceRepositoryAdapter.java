package fpt.teddypet.infrastructure.adapter.services;

import fpt.teddypet.application.port.output.services.ServiceComboServiceRepositoryPort;
import fpt.teddypet.domain.entity.ServiceComboService;
import fpt.teddypet.infrastructure.persistence.postgres.repository.services.ServiceComboServiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class ServiceComboServiceRepositoryAdapter implements ServiceComboServiceRepositoryPort {

    private final ServiceComboServiceRepository serviceComboServiceRepository;

    @Override
    public ServiceComboService save(ServiceComboService item) {
        return serviceComboServiceRepository.save(item);
    }

    @Override
    public void saveAll(List<ServiceComboService> items) {
        serviceComboServiceRepository.saveAll(items);
    }

    @Override
    public List<ServiceComboService> findByServiceComboId(Long serviceComboId) {
        return serviceComboServiceRepository.findById_ServiceComboId(serviceComboId);
    }

    @Override
    public void deleteByServiceComboId(Long serviceComboId) {
        serviceComboServiceRepository.deleteById_ServiceComboId(serviceComboId);
    }

    @Override
    public void delete(ServiceComboService item) {
        serviceComboServiceRepository.delete(item);
    }
}
