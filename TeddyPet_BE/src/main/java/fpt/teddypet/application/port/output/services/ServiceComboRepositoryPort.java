package fpt.teddypet.application.port.output.services;

import fpt.teddypet.domain.entity.ServiceCombo;

import java.util.List;
import java.util.Optional;

public interface ServiceComboRepositoryPort {

    ServiceCombo save(ServiceCombo serviceCombo);

    Optional<ServiceCombo> findById(Long id);

    Optional<ServiceCombo> findByCode(String code);

    Optional<ServiceCombo> findBySlug(String slug);

    List<ServiceCombo> findAll();

    List<ServiceCombo> findAllActive();

    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, Long id);

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, Long id);

    void delete(ServiceCombo serviceCombo);
}
