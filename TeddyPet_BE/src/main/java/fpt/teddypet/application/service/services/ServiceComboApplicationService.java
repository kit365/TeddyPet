package fpt.teddypet.application.service.services;

import fpt.teddypet.application.constants.services.servicecombo.ServiceComboLogMessages;
import fpt.teddypet.application.constants.services.servicecombo.ServiceComboMessages;
import fpt.teddypet.application.dto.request.services.combo.ServiceComboUpsertRequest;
import fpt.teddypet.application.dto.response.service.combo.ServiceComboDetailResponse;
import fpt.teddypet.application.dto.response.service.combo.ServiceComboResponse;
import fpt.teddypet.application.mapper.services.ServiceComboMapper;
import fpt.teddypet.application.port.input.services.ServiceComboServiceInput;
import fpt.teddypet.application.port.output.services.ServiceComboRepositoryPort;
import fpt.teddypet.application.port.output.services.ServiceComboServiceRepositoryPort;
import fpt.teddypet.application.port.output.services.ServicePricingRepositoryPort;
import fpt.teddypet.application.port.output.services.ServiceRepositoryPort;
import fpt.teddypet.application.util.SlugUtil;
import fpt.teddypet.application.util.ValidationUtils;
import fpt.teddypet.domain.entity.ServiceCombo;
import fpt.teddypet.domain.entity.ServiceComboService;
import fpt.teddypet.domain.entity.ServiceComboServiceId;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ServiceComboApplicationService implements ServiceComboServiceInput {

    private final ServiceComboRepositoryPort serviceComboRepositoryPort;
    private final ServiceComboServiceRepositoryPort serviceComboServiceRepositoryPort;
    private final ServiceRepositoryPort serviceRepositoryPort;
    private final ServicePricingRepositoryPort servicePricingRepositoryPort;
    private final ServiceComboMapper serviceComboMapper;

    @Override
    @Transactional
    public void upsert(ServiceComboUpsertRequest request) {
        log.info(ServiceComboLogMessages.LOG_SERVICE_COMBO_UPSERT_START, request.comboName());

        ServiceCombo combo;
        boolean isNew = request.comboId() == null;

        if (isNew) {
            combo = ServiceCombo.builder().build();
            combo.setDeleted(false);
        } else {
            combo = getById(request.comboId());
        }

        serviceComboMapper.updateComboFromRequest(request, combo);

        String slugToUse;
        if (request.slug() != null && !request.slug().isBlank()) {
            slugToUse = request.slug().trim();
            ValidationUtils.ensureUnique(
                    () -> isNew
                            ? serviceComboRepositoryPort.existsBySlug(slugToUse)
                            : serviceComboRepositoryPort.existsBySlugAndIdNot(slugToUse, combo.getId()),
                    String.format(ServiceComboMessages.MESSAGE_SERVICE_COMBO_SLUG_ALREADY_EXISTS, slugToUse)
            );
        } else {
            slugToUse = SlugUtil.toSlug(request.comboName());
            ValidationUtils.ensureUnique(
                    () -> isNew
                            ? serviceComboRepositoryPort.existsBySlug(slugToUse)
                            : serviceComboRepositoryPort.existsBySlugAndIdNot(slugToUse, combo.getId()),
                    String.format(ServiceComboMessages.MESSAGE_SERVICE_COMBO_SLUG_ALREADY_EXISTS, slugToUse)
            );
        }
        combo.setSlug(slugToUse);

        String code = request.code().trim();
        ValidationUtils.ensureUnique(
                () -> isNew
                        ? serviceComboRepositoryPort.existsByCode(code)
                        : serviceComboRepositoryPort.existsByCodeAndIdNot(code, combo.getId()),
                String.format(ServiceComboMessages.MESSAGE_SERVICE_COMBO_CODE_ALREADY_EXISTS, code)
        );
        combo.setCode(code);

        if (request.discountPercentage() != null) {
            combo.setDiscountPercentage(request.discountPercentage());
        } else {
            combo.setDiscountPercentage(BigDecimal.ZERO);
        }

        ServiceCombo savedCombo = serviceComboRepositoryPort.save(combo);

        serviceComboServiceRepositoryPort.deleteByServiceComboId(savedCombo.getId());

        List<ServiceComboService> items = new ArrayList<>();
        for (var itemReq : request.serviceItems()) {
            fpt.teddypet.domain.entity.Service service = serviceRepositoryPort.findById(itemReq.serviceId())
                    .orElseThrow(() -> new EntityNotFoundException(
                            String.format(ServiceComboMessages.MESSAGE_SERVICE_COMBO_SERVICE_NOT_FOUND, itemReq.serviceId())));
            ValidationUtils.ensure(service.isActive() && !service.isDeleted(),
                    String.format(ServiceComboMessages.MESSAGE_SERVICE_COMBO_SERVICE_INACTIVE, itemReq.serviceId()));
            ValidationUtils.ensure(itemReq.quantity() >= 1, "Số lượng phải lớn hơn hoặc bằng 1");

            ServiceComboServiceId id = ServiceComboServiceId.builder()
                    .serviceComboId(savedCombo.getId())
                    .serviceId(service.getId())
                    .build();
            ServiceComboService comboItem = ServiceComboService.builder()
                    .id(id)
                    .quantity(itemReq.quantity())
                    .serviceCombo(savedCombo)
                    .service(service)
                    .build();
            items.add(serviceComboServiceRepositoryPort.save(comboItem));
        }
        savedCombo.getServiceItems().clear();
        savedCombo.getServiceItems().addAll(items);

        BigDecimal originalPrice = BigDecimal.ZERO;
        for (ServiceComboService item : items) {
            BigDecimal minPrice = servicePricingRepositoryPort.findMinActivePriceByServiceId(item.getService().getId())
                    .orElse(BigDecimal.ZERO);
            originalPrice = originalPrice.add(minPrice.multiply(BigDecimal.valueOf(item.getQuantity())));
        }
        savedCombo.setOriginalPrice(originalPrice);
        serviceComboRepositoryPort.save(savedCombo);

        log.info(ServiceComboLogMessages.LOG_SERVICE_COMBO_UPSERT_SUCCESS, savedCombo.getId());
    }

    @Override
    @Transactional(readOnly = true)
    public ServiceComboDetailResponse getDetail(Long id) {
        ServiceCombo combo = getById(id);
        return serviceComboMapper.toDetailResponse(combo);
    }

    @Override
    public ServiceCombo getById(Long id) {
        return serviceComboRepositoryPort.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        String.format(ServiceComboMessages.MESSAGE_SERVICE_COMBO_NOT_FOUND_BY_ID, id)));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ServiceComboResponse> getAll() {
        return serviceComboRepositoryPort.findAllActive().stream()
                .map(serviceComboMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ServiceComboDetailResponse> getAllWithDetails() {
        return serviceComboRepositoryPort.findAllActive().stream()
                .map(serviceComboMapper::toDetailResponse)
                .toList();
    }

    @Override
    @Transactional
    public void delete(Long id) {
        log.info(ServiceComboLogMessages.LOG_SERVICE_COMBO_DELETE_START, id);
        ServiceCombo combo = getById(id);
        serviceComboServiceRepositoryPort.deleteByServiceComboId(id);
        combo.getServiceItems().clear();
        combo.setDeleted(true);
        combo.setActive(false);
        serviceComboRepositoryPort.save(combo);
        log.info(ServiceComboLogMessages.LOG_SERVICE_COMBO_DELETE_SUCCESS, id);
    }
}
