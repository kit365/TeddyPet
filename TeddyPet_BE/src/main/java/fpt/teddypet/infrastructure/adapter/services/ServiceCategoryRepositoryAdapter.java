package fpt.teddypet.infrastructure.adapter.services;

import fpt.teddypet.application.port.output.services.ServiceCategoryRepositoryPort;
import fpt.teddypet.domain.entity.ServiceCategory;
import fpt.teddypet.infrastructure.persistence.postgres.repository.services.ServiceCategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class ServiceCategoryRepositoryAdapter implements ServiceCategoryRepositoryPort {

    private final ServiceCategoryRepository serviceCategoryRepository;

    @Override
    public ServiceCategory save(ServiceCategory serviceCategory) {
        return serviceCategoryRepository.save(serviceCategory);
    }

    @Override
    public void saveAll(List<ServiceCategory> serviceCategories) {
        serviceCategoryRepository.saveAll(serviceCategories);
    }

    @Override
    public Optional<ServiceCategory> findById(Long id) {
        return serviceCategoryRepository.findById(id);
    }

    @Override
    public Optional<ServiceCategory> findBySlug(String slug) {
        return serviceCategoryRepository.findBySlug(slug);
    }

    @Override
    public List<ServiceCategory> findAll() {
        return serviceCategoryRepository.findAll();
    }

    @Override
    public List<ServiceCategory> findAllActive() {
        return serviceCategoryRepository.findByIsActiveTrueAndIsDeletedFalseOrderByDisplayOrderAsc();
    }

    @Override
    public List<ServiceCategory> findRootCategories() {
        return serviceCategoryRepository.findByParentIsNullAndIsDeletedFalse();
    }

    @Override
    public List<ServiceCategory> findChildCategories(Long parentId) {
        return serviceCategoryRepository.findByParentIdAndIsDeletedFalse(parentId);
    }

    @Override
    public boolean existsBySlug(String slug) {
        return serviceCategoryRepository.existsBySlug(slug);
    }

    @Override
    public boolean existsBySlugAndIdNot(String slug, Long id) {
        return serviceCategoryRepository.existsBySlugAndIdNot(slug, id);
    }

    @Override
    public List<ServiceCategory> findAllByIdInAndIsActiveAndIsDeleted(List<Long> ids, boolean isActive, boolean isDeleted) {
        return serviceCategoryRepository.findAllByIdInAndIsActiveAndIsDeleted(ids, isActive, isDeleted);
    }

    @Override
    public void delete(ServiceCategory serviceCategory) {
        serviceCategoryRepository.delete(serviceCategory);
    }
}
