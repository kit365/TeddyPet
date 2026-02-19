package fpt.teddypet.application.service.services;

import fpt.teddypet.application.constants.services.servicecategory.ServiceCategoryMessages;
import fpt.teddypet.application.constants.services.service.ServiceLogMessages;
import fpt.teddypet.application.constants.services.service.ServiceMessages;
import fpt.teddypet.application.dto.request.services.service.ServiceUpsertRequest;
import fpt.teddypet.application.dto.response.service.service.ServiceInfo;
import fpt.teddypet.application.dto.response.service.service.ServiceResponse;
import fpt.teddypet.application.mapper.services.ServiceMapper;
import fpt.teddypet.application.port.input.services.ServiceService;
import fpt.teddypet.application.port.output.services.ServiceCategoryRepositoryPort;
import fpt.teddypet.application.port.output.services.ServiceRepositoryPort;
import fpt.teddypet.application.util.ListUtil;
import fpt.teddypet.application.util.ValidationUtils;
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
public class ServiceApplicationService implements ServiceService {

    private final ServiceRepositoryPort serviceRepositoryPort;
    private final ServiceCategoryRepositoryPort serviceCategoryRepositoryPort;
    private final ServiceMapper serviceMapper;

    @Override
    @Transactional
    public ServiceResponse upsert(ServiceUpsertRequest request) {
        log.info(ServiceLogMessages.LOG_SERVICE_UPSERT_START, request.serviceName());

        fpt.teddypet.domain.entity.Service entity;
        boolean isNew = request.serviceId() == null;

        if (isNew) {
            entity = fpt.teddypet.domain.entity.Service.builder().build();
            entity.setDeleted(false);
        } else {
            entity = getById(request.serviceId());
        }

        serviceMapper.updateServiceFromRequest(request, entity);

        ServiceCategory category = serviceCategoryRepositoryPort.findById(request.serviceCategoryId())
                .orElseThrow(() -> new EntityNotFoundException(
                        String.format(ServiceCategoryMessages.MESSAGE_SERVICE_CATEGORY_NOT_FOUND_BY_ID, request.serviceCategoryId())));
        entity.setServiceCategory(category);

        String code = request.code().trim();
        ValidationUtils.ensureUnique(
                () -> isNew
                        ? serviceRepositoryPort.existsByCode(code)
                        : serviceRepositoryPort.existsByCodeAndIdNot(code, entity.getId()),
                String.format(ServiceMessages.MESSAGE_SERVICE_CODE_ALREADY_EXISTS, code)
        );
        entity.setCode(code);

        String name = request.serviceName().trim();
        ValidationUtils.ensureUnique(
                () -> isNew
                        ? serviceRepositoryPort.existsByServiceNameIgnoreCase(name)
                        : serviceRepositoryPort.existsByServiceNameIgnoreCaseAndIdNot(name, entity.getId()),
                String.format(ServiceMessages.MESSAGE_SERVICE_NAME_ALREADY_EXISTS, name)
        );
        entity.setServiceName(name);

        fpt.teddypet.domain.entity.Service saved = serviceRepositoryPort.save(entity);
        log.info(ServiceLogMessages.LOG_SERVICE_UPSERT_SUCCESS, saved.getId());
        return serviceMapper.toResponse(saved);
    }

    @Override
    public ServiceResponse getDetail(Long id) {
        return serviceMapper.toResponse(getById(id));
    }

    @Override
    public fpt.teddypet.domain.entity.Service getById(Long id) {
        return serviceRepositoryPort.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        String.format(ServiceMessages.MESSAGE_SERVICE_NOT_FOUND_BY_ID, id)));
    }

    @Override
    public List<ServiceResponse> getAll() {
        return serviceRepositoryPort.findAllActive().stream()
                .map(serviceMapper::toResponse)
                .toList();
    }

    @Override
    public List<ServiceResponse> getByCategoryId(Long categoryId) {
        return serviceRepositoryPort.findByCategoryId(categoryId).stream()
                .map(serviceMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public void delete(Long id) {
        log.info(ServiceLogMessages.LOG_SERVICE_DELETE_START, id);
        fpt.teddypet.domain.entity.Service entity = getById(id);
        entity.setDeleted(true);
        entity.setActive(false);
        serviceRepositoryPort.save(entity);
        log.info(ServiceLogMessages.LOG_SERVICE_DELETE_SUCCESS, id);
    }

    @Override
    public ServiceInfo toInfo(fpt.teddypet.domain.entity.Service service) {
        return serviceMapper.toInfo(service);
    }

    @Override
    public List<ServiceInfo> toInfos(List<fpt.teddypet.domain.entity.Service> services) {
        return ListUtil.safe(services).stream()
                .map(serviceMapper::toInfo)
                .toList();
    }
}
