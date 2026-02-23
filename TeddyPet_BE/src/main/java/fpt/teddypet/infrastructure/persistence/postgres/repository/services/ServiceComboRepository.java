package fpt.teddypet.infrastructure.persistence.postgres.repository.services;

import fpt.teddypet.domain.entity.ServiceCombo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceComboRepository extends JpaRepository<ServiceCombo, Long> {

    Optional<ServiceCombo> findByCode(String code);

    Optional<ServiceCombo> findBySlug(String slug);

    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, Long id);

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, Long id);

    List<ServiceCombo> findByIsActiveTrueAndIsDeletedFalse();
}
