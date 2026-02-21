package fpt.teddypet.application.port.output.services;

import fpt.teddypet.domain.entity.ServiceCategory;

import java.util.List;
import java.util.Optional;

public interface ServiceCategoryRepositoryPort {

    ServiceCategory save(ServiceCategory serviceCategory);

    void saveAll(List<ServiceCategory> serviceCategories);

    Optional<ServiceCategory> findById(Long id);

    Optional<ServiceCategory> findBySlug(String slug);

    List<ServiceCategory> findAll();

    List<ServiceCategory> findAllActive();

    List<ServiceCategory> findRootCategories();

    List<ServiceCategory> findChildCategories(Long parentId);

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, Long id);

    List<ServiceCategory> findAllByIdInAndIsActiveAndIsDeleted(List<Long> ids, boolean isActive, boolean isDeleted);

    void delete(ServiceCategory serviceCategory);
}
