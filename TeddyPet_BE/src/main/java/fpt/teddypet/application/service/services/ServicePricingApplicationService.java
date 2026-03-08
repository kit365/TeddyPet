package fpt.teddypet.application.service.services;

import fpt.teddypet.application.constants.services.servicepricing.ServicePricingLogMessages;
import fpt.teddypet.application.constants.services.servicepricing.ServicePricingMessages;
import fpt.teddypet.application.dto.request.services.pricing.ServicePricingUpsertRequest;
import fpt.teddypet.application.dto.response.service.pricing.ServicePricingResponse;
import fpt.teddypet.application.mapper.services.ServicePricingMapper;
import fpt.teddypet.application.port.input.services.ServicePricingService;
import fpt.teddypet.application.port.output.services.ServicePricingRepositoryPort;
import fpt.teddypet.application.port.output.services.ServiceRepositoryPort;
import fpt.teddypet.application.port.output.room.RoomTypeRepositoryPort;
import fpt.teddypet.domain.entity.ServicePricing;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ServicePricingApplicationService implements ServicePricingService {

    private final ServicePricingRepositoryPort servicePricingRepositoryPort;
    private final ServiceRepositoryPort serviceRepositoryPort;
    private final RoomTypeRepositoryPort roomTypeRepositoryPort;
    private final ServicePricingMapper servicePricingMapper;

    @Override
    @Transactional
    public void upsert(ServicePricingUpsertRequest request) {
        log.info(ServicePricingLogMessages.LOG_SERVICE_PRICING_UPSERT_START, request.pricingName());

        ServicePricing entity;
        boolean isNew = request.pricingId() == null;

        if (isNew) {
            entity = ServicePricing.builder().build();
            entity.setDeleted(false);
        } else {
            entity = getById(request.pricingId());
        }

        servicePricingMapper.updateFromRequest(request, entity);

        fpt.teddypet.domain.entity.Service service = serviceRepositoryPort.findById(request.serviceId())
                .orElseThrow(() -> new EntityNotFoundException(
                        String.format(ServicePricingMessages.MESSAGE_SERVICE_NOT_FOUND_FOR_PRICING, request.serviceId())));
        entity.setService(service);

        if (request.roomTypeId() != null) {
            entity.setRoomType(roomTypeRepositoryPort.findById(request.roomTypeId())
                    .orElseThrow(() -> new EntityNotFoundException(
                            "Không tìm thấy loại phòng với id: " + request.roomTypeId())));
        } else {
            entity.setRoomType(null);
        }

        if (request.priority() != null) {
            entity.setPriority(request.priority());
        } else {
            entity.setPriority(0);
        }

        ServicePricing saved = servicePricingRepositoryPort.save(entity);
        syncServiceBasePrice(service.getId());
        log.info(ServicePricingLogMessages.LOG_SERVICE_PRICING_UPSERT_SUCCESS, saved.getId());
    }

    @Override
    public ServicePricingResponse getDetail(Long id) {
        return servicePricingMapper.toResponse(getById(id));
    }

    @Override
    public ServicePricing getById(Long id) {
        return servicePricingRepositoryPort.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        String.format(ServicePricingMessages.MESSAGE_SERVICE_PRICING_NOT_FOUND_BY_ID, id)));
    }

    @Override
    public List<ServicePricingResponse> getByServiceId(Long serviceId) {
        return servicePricingRepositoryPort.findByServiceIdAndActive(serviceId, true).stream()
                .map(servicePricingMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public void delete(Long id) {
        log.info(ServicePricingLogMessages.LOG_SERVICE_PRICING_DELETE_START, id);
        ServicePricing entity = getById(id);
        Long serviceId = entity.getService() != null ? entity.getService().getId() : null;
        entity.setDeleted(true);
        entity.setActive(false);
        servicePricingRepositoryPort.save(entity);
        if (serviceId != null) {
            syncServiceBasePrice(serviceId);
        }
        log.info(ServicePricingLogMessages.LOG_SERVICE_PRICING_DELETE_SUCCESS, id);
    }

    /**
     * basePrice is informational and derived as the minimum price among active, non-deleted pricing rules.
     */
    private void syncServiceBasePrice(Long serviceId) {
        fpt.teddypet.domain.entity.Service service = serviceRepositoryPort.findById(serviceId)
                .orElseThrow(() -> new EntityNotFoundException(
                        String.format(ServicePricingMessages.MESSAGE_SERVICE_NOT_FOUND_FOR_PRICING, serviceId)));

        List<ServicePricing> activeRules = servicePricingRepositoryPort.findByServiceIdAndActive(serviceId, true);
        BigDecimal minPrice = activeRules.stream()
                .map(ServicePricing::getPrice)
                .filter(p -> p != null)
                .min(BigDecimal::compareTo)
                .orElse(null);

        service.setBasePrice(minPrice);
        serviceRepositoryPort.save(service);
    }
}
