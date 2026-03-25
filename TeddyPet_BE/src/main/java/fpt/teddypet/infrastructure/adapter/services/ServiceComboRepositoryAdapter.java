package fpt.teddypet.infrastructure.adapter.services;

import fpt.teddypet.application.port.output.services.ServiceComboRepositoryPort;
import fpt.teddypet.domain.entity.ServiceCombo;
import fpt.teddypet.infrastructure.persistence.postgres.repository.services.ServiceComboRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class ServiceComboRepositoryAdapter implements ServiceComboRepositoryPort {

    private final ServiceComboRepository serviceComboRepository;

    @Override
    public ServiceCombo save(ServiceCombo serviceCombo) {
        return serviceComboRepository.save(serviceCombo);
    }

    @Override
    public Optional<ServiceCombo> findById(Long id) {
        return serviceComboRepository.findById(id);
    }

    @Override
    public Optional<ServiceCombo> findByCode(String code) {
        return serviceComboRepository.findByCode(code);
    }

    @Override
    public Optional<ServiceCombo> findBySlug(String slug) {
        return serviceComboRepository.findBySlug(slug);
    }

    @Override
    public List<ServiceCombo> findAll() {
        return serviceComboRepository.findAll();
    }

    @Override
    public List<ServiceCombo> findAllActive() {
        return serviceComboRepository.findByIsActiveTrueAndIsDeletedFalse();
    }

    @Override
    public boolean existsByCode(String code) {
        return serviceComboRepository.existsByCode(code);
    }

    @Override
    public boolean existsByCodeAndIdNot(String code, Long id) {
        return serviceComboRepository.existsByCodeAndIdNot(code, id);
    }

    @Override
    public boolean existsBySlug(String slug) {
        return serviceComboRepository.existsBySlug(slug);
    }

    @Override
    public boolean existsBySlugAndIdNot(String slug, Long id) {
        return serviceComboRepository.existsBySlugAndIdNot(slug, id);
    }

    @Override
    public void delete(ServiceCombo serviceCombo) {
        serviceComboRepository.delete(serviceCombo);
    }
}
