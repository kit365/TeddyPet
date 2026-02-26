package fpt.teddypet.application.service.shop;

import fpt.teddypet.application.constants.shop.ShopMessages;
import fpt.teddypet.application.dto.request.shop.TimeSlotUpsertRequest;
import fpt.teddypet.application.dto.response.shop.TimeSlotResponse;
import fpt.teddypet.application.mapper.shop.TimeSlotMapper;
import fpt.teddypet.application.port.input.shop.TimeSlotService;
import fpt.teddypet.application.port.output.shop.TimeSlotRepositoryPort;
import fpt.teddypet.application.port.output.services.ServiceRepositoryPort;
import fpt.teddypet.domain.entity.TimeSlot;
import fpt.teddypet.domain.enums.scheduling.SlotTypeEnum;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TimeSlotApplicationService implements TimeSlotService {

    private final TimeSlotRepositoryPort repository;
    private final ServiceRepositoryPort serviceRepository;
    private final TimeSlotMapper mapper;

    @Override
    public List<TimeSlotResponse> getByServiceId(Long serviceId) {
        return repository.findByServiceId(serviceId).stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    public TimeSlotResponse getById(Long id) {
        return mapper.toResponse(getEntity(id));
    }

    @Override
    @Transactional
    public void upsert(TimeSlotUpsertRequest request) {
        fpt.teddypet.domain.entity.Service service = serviceRepository.findById(request.serviceId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy dịch vụ"));

        TimeSlot entity;
        if (request.id() != null) {
            entity = getEntity(request.id());
        } else {
            entity = TimeSlot.builder().build();
            entity.setDeleted(false);
            entity.setActive(true);
            entity.setCurrentBookings(0);
        }

        mapper.updateFromRequest(request, entity);
        entity.setService(service);
        entity.setMaxCapacity(request.maxCapacity() != null ? request.maxCapacity() : 1);
        entity.setSlotType(request.slotType() != null ? request.slotType() : SlotTypeEnum.REGULAR);
        repository.save(entity);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        TimeSlot entity = getEntity(id);
        entity.setDeleted(true);
        entity.setActive(false);
        repository.save(entity);
    }

    private TimeSlot getEntity(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        String.format(ShopMessages.MESSAGE_TIME_SLOT_NOT_FOUND, id)));
    }
}
