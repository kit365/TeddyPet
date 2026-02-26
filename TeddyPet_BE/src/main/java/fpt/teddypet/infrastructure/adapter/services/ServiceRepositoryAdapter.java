package fpt.teddypet.infrastructure.adapter.services;

import fpt.teddypet.application.port.output.services.ServiceRepositoryPort;
import fpt.teddypet.domain.entity.Service;
import fpt.teddypet.infrastructure.persistence.postgres.repository.services.ServiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class ServiceRepositoryAdapter implements ServiceRepositoryPort {

    private final ServiceRepository serviceRepository;

    @Override
    public Service save(Service service) {
        return serviceRepository.save(service);
    }

    @Override
    public Optional<Service> findById(Long id) {
        return serviceRepository.findById(id);
    }

    @Override
    public Optional<Service> findByCode(String code) {
        return serviceRepository.findByCode(code);
    }

    @Override
    public List<Service> findAll() {
        return serviceRepository.findAll();
    }

    @Override
    public List<Service> findAllActive() {
        return serviceRepository.findByIsActiveTrueAndIsDeletedFalse();
    }

    @Override
    public List<Service> findByCategoryId(Long categoryId) {
        return serviceRepository.findByServiceCategory_IdAndIsActiveTrueAndIsDeletedFalse(categoryId);
    }

    @Override
    public boolean existsByCode(String code) {
        return serviceRepository.existsByCode(code);
    }

    @Override
    public boolean existsByCodeAndIdNot(String code, Long id) {
        return serviceRepository.existsByCodeAndIdNot(code, id);
    }

    @Override
    public boolean existsByServiceNameIgnoreCase(String serviceName) {
        return serviceRepository.existsByServiceNameIgnoreCase(serviceName);
    }

    @Override
    public boolean existsByServiceNameIgnoreCaseAndIdNot(String serviceName, Long id) {
        return serviceRepository.existsByServiceNameIgnoreCaseAndIdNot(serviceName, id);
    }

    @Override
    public void delete(Service service) {
        serviceRepository.delete(service);
    }
}
