package fpt.teddypet.application.service.services;

import fpt.teddypet.application.constants.services.servicecategory.ServiceCategoryLogMessages;
import fpt.teddypet.application.constants.services.servicecategory.ServiceCategoryMessages;
import fpt.teddypet.application.dto.request.services.category.ServiceCategoryUpsertRequest;
import fpt.teddypet.application.dto.response.service.category.ServiceCategoryInfo;
import fpt.teddypet.application.dto.response.service.category.ServiceCategoryNestedResponse;
import fpt.teddypet.application.dto.response.service.category.ServiceCategoryResponse;
import fpt.teddypet.application.mapper.services.ServiceCategoryMapper;
import fpt.teddypet.application.port.input.services.ServiceCategoryService;
import fpt.teddypet.application.port.output.services.ServiceCategoryRepositoryPort;
import fpt.teddypet.application.util.DisplayOrderUtil;
import fpt.teddypet.application.util.ListUtil;
import fpt.teddypet.application.util.SlugUtil;
import fpt.teddypet.domain.entity.ServiceCategory;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ServiceCategoryApplicationService implements ServiceCategoryService {

    private final ServiceCategoryRepositoryPort serviceCategoryRepositoryPort;
    private final ServiceCategoryMapper serviceCategoryMapper;

    @Override
    @Transactional
    public void upsert(ServiceCategoryUpsertRequest request) {
        log.info(ServiceCategoryLogMessages.LOG_SERVICE_CATEGORY_UPSERT_START, request.name());

        ServiceCategory category;
        boolean isNew = request.categoryId() == null;

        if (isNew) {
            category = ServiceCategory.builder().build();
            category.setDeleted(false);
        } else {
            category = getById(request.categoryId());
        }

        serviceCategoryMapper.updateCategoryFromRequest(request, category);

        if (isNew || !category.getCategoryName().equals(request.name())) {
            String baseSlug = SlugUtil.toSlug(request.name());
            String finalSlug = baseSlug;
            int counter = 1;
            while (serviceCategoryRepositoryPort.existsBySlugAndIdNot(finalSlug, isNew ? -1L : category.getId())) {
                finalSlug = baseSlug + "-" + counter++;
            }
            category.setSlug(finalSlug);
        }

        if (request.parentId() != null) {
            ServiceCategory parent = getById(request.parentId());
            validateNoCircularReference(category, parent);
            category.setParent(parent);
        } else {
            category.setParent(null);
        }

        handleDisplayOrder(category, request.displayOrder(), request.parentId());

        ServiceCategory saved = serviceCategoryRepositoryPort.save(category);
        log.info(ServiceCategoryLogMessages.LOG_SERVICE_CATEGORY_UPSERT_SUCCESS, saved.getId());
    }

    @Override
    public ServiceCategoryResponse getCategoryDetail(Long id) {
        return serviceCategoryMapper.toResponse(getById(id));
    }

    @Override
    public ServiceCategory getById(Long id) {
        return serviceCategoryRepositoryPort.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        String.format(ServiceCategoryMessages.MESSAGE_SERVICE_CATEGORY_NOT_FOUND_BY_ID, id)));
    }

    @Override
    public List<ServiceCategoryResponse> getAll() {
        return serviceCategoryRepositoryPort.findAllActive().stream()
                .map(serviceCategoryMapper::toResponse)
                .toList();
    }

    @Override
    public List<ServiceCategoryResponse> getRootCategories() {
        return serviceCategoryRepositoryPort.findRootCategories().stream()
                .map(serviceCategoryMapper::toResponse)
                .toList();
    }

    @Override
    public List<ServiceCategoryNestedResponse> getNestedCategories() {
        List<ServiceCategory> rootCategories = serviceCategoryRepositoryPort.findRootCategories();
        return serviceCategoryMapper.toNestedResponseList(rootCategories);
    }

    @Override
    public List<ServiceCategoryResponse> getChildCategories(Long parentId) {
        return serviceCategoryRepositoryPort.findChildCategories(parentId).stream()
                .map(serviceCategoryMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public void delete(Long id) {
        log.info(ServiceCategoryLogMessages.LOG_SERVICE_CATEGORY_DELETE_START, id);
        ServiceCategory category = getById(id);
        category.setDeleted(true);
        category.setActive(false);
        serviceCategoryRepositoryPort.save(category);
        normalizeSiblingsDisplayOrder(category.getParent());
        log.info(ServiceCategoryLogMessages.LOG_SERVICE_CATEGORY_DELETE_SUCCESS, id);
    }

    @Override
    public ServiceCategoryInfo toInfo(ServiceCategory category) {
        return serviceCategoryMapper.toInfo(category);
    }

    @Override
    public List<ServiceCategoryInfo> toInfos(List<ServiceCategory> categories) {
        return ListUtil.safe(categories).stream()
                .map(serviceCategoryMapper::toInfo)
                .toList();
    }

    private void validateNoCircularReference(ServiceCategory category, ServiceCategory parent) {
        if (category.getId() == null) return;
        if (category.getId().equals(parent.getId())) {
            throw new IllegalArgumentException(ServiceCategoryMessages.MESSAGE_SERVICE_CATEGORY_CIRCULAR_REFERENCE);
        }
        ServiceCategory current = parent;
        while (current != null) {
            if (current.getId().equals(category.getId())) {
                throw new IllegalArgumentException(ServiceCategoryMessages.MESSAGE_SERVICE_CATEGORY_CIRCULAR_REFERENCE);
            }
            current = current.getParent();
        }
    }

    private void handleDisplayOrder(ServiceCategory category, Integer requestedOrder, Long parentId) {
        List<ServiceCategory> siblings = parentId == null
                ? serviceCategoryRepositoryPort.findRootCategories()
                : serviceCategoryRepositoryPort.findChildCategories(parentId);
        if (category.getId() != null) {
            siblings.removeIf(c -> c.getId().equals(category.getId()));
        }
        if (requestedOrder != null) {
            category.setDisplayOrder(requestedOrder);
        } else {
            category.setDisplayOrder(DisplayOrderUtil.getNextDisplayOrder(siblings, ServiceCategory::getDisplayOrder));
        }
    }

    private void normalizeSiblingsDisplayOrder(ServiceCategory parent) {
        List<ServiceCategory> siblings = parent == null
                ? serviceCategoryRepositoryPort.findRootCategories()
                : serviceCategoryRepositoryPort.findChildCategories(parent.getId());
        if (DisplayOrderUtil.hasGaps(siblings, ServiceCategory::getDisplayOrder)) {
            DisplayOrderUtil.normalizeDisplayOrders(
                    siblings,
                    ServiceCategory::getDisplayOrder,
                    ServiceCategory::setDisplayOrder
            );
            serviceCategoryRepositoryPort.saveAll(siblings);
        }
    }
}
