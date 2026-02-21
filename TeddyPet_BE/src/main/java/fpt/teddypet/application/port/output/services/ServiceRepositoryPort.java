package fpt.teddypet.application.port.output.services;

import fpt.teddypet.domain.entity.Service;

import java.util.List;
import java.util.Optional;

public interface ServiceRepositoryPort {

    Service save(Service service);

    Optional<Service> findById(Long id);

    Optional<Service> findByCode(String code);

    List<Service> findAll();

    List<Service> findAllActive();

    List<Service> findByCategoryId(Long categoryId);

    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, Long id);

    boolean existsByServiceNameIgnoreCase(String serviceName);

    boolean existsByServiceNameIgnoreCaseAndIdNot(String serviceName, Long id);

    void delete(Service service);
}
