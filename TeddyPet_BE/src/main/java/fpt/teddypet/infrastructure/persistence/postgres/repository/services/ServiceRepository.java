package fpt.teddypet.infrastructure.persistence.postgres.repository.services;

import fpt.teddypet.domain.entity.Service;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceRepository extends JpaRepository<Service, Long> {

    Optional<Service> findByCode(String code);

    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, Long id);

    boolean existsByServiceNameIgnoreCase(String serviceName);

    boolean existsByServiceNameIgnoreCaseAndIdNot(String serviceName, Long id);

    List<Service> findByIsActiveTrueAndIsDeletedFalse();

    List<Service> findByServiceCategory_IdAndIsActiveTrueAndIsDeletedFalse(Long serviceCategoryId);
}
