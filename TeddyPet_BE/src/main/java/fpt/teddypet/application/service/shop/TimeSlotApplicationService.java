package fpt.teddypet.application.service.shop;

import fpt.teddypet.application.constants.shop.ShopMessages;
import fpt.teddypet.application.dto.request.shop.TimeSlotUpsertRequest;
import fpt.teddypet.application.dto.response.shop.TimeSlotResponse;
import fpt.teddypet.application.mapper.shop.TimeSlotMapper;
import fpt.teddypet.application.port.input.shop.TimeSlotService;
import fpt.teddypet.application.port.output.shop.TimeSlotRepositoryPort;
import fpt.teddypet.application.port.output.shop.ShopOperationHourRepositoryPort;
import fpt.teddypet.application.port.output.services.ServiceRepositoryPort;
import fpt.teddypet.domain.entity.ShopOperationHour;
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
    private final ShopOperationHourRepositoryPort shopOperationHourRepository;
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

        if (!request.startTime().isBefore(request.endTime())) {
            throw new IllegalArgumentException(ShopMessages.MESSAGE_TIME_SLOT_INVALID_RANGE);
        }

        validateShopOperationHours(request);
        validateOverlap(request);

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

    private void validateShopOperationHours(TimeSlotUpsertRequest request) {
        List<ShopOperationHour> hours = shopOperationHourRepository.findAllActive();
        List<ShopOperationHour> applicableHours;

        switch (request.dayType()) {
            case WEEKDAY ->
                applicableHours = hours.stream().filter(h -> h.getDayOfWeek() >= 1 && h.getDayOfWeek() <= 5).toList();
            case WEEKEND ->
                applicableHours = hours.stream().filter(h -> h.getDayOfWeek() == 6 || h.getDayOfWeek() == 7).toList();
            default -> applicableHours = List.of();
        }

        for (ShopOperationHour h : applicableHours) {
            if (Boolean.TRUE.equals(h.getIsDayOff())) {
                continue;
            }
            String dayName = h.getDayOfWeek() == 7 ? "Chủ nhật" : "Thứ " + (h.getDayOfWeek() + 1);

            if (h.getOpenTime() != null && request.startTime().isBefore(h.getOpenTime())) {
                throw new IllegalArgumentException(String.format(ShopMessages.MESSAGE_TIME_SLOT_OUT_OF_SHOP_HOURS,
                        "Ngày", dayName, h.getOpenTime(), h.getCloseTime() != null ? h.getCloseTime() : "hết giờ"));
            }
            if (h.getCloseTime() != null && request.endTime().isAfter(h.getCloseTime())) {
                throw new IllegalArgumentException(String.format(ShopMessages.MESSAGE_TIME_SLOT_OUT_OF_SHOP_HOURS,
                        "Ngày", dayName, h.getOpenTime() != null ? h.getOpenTime() : "bắt đầu", h.getCloseTime()));
            }

            if (h.getBreakStartTime() != null && h.getBreakEndTime() != null) {
                if (request.startTime().isBefore(h.getBreakEndTime())
                        && request.endTime().isAfter(h.getBreakStartTime())) {
                    throw new IllegalArgumentException(String.format(ShopMessages.MESSAGE_TIME_SLOT_IN_BREAK,
                            h.getBreakStartTime(), h.getBreakEndTime(), "ngày", dayName));
                }
            }
        }
    }

    private void validateOverlap(TimeSlotUpsertRequest request) {
        List<TimeSlot> existingSlots = repository.findByServiceIdAndDayType(request.serviceId(), request.dayType());
        for (TimeSlot existing : existingSlots) {
            if (request.id() != null && request.id().equals(existing.getId())) {
                continue;
            }
            if (request.startTime().isBefore(existing.getEndTime())
                    && request.endTime().isAfter(existing.getStartTime())) {
                throw new IllegalArgumentException(String.format(ShopMessages.MESSAGE_TIME_SLOT_OVERLAP,
                        existing.getStartTime(), existing.getEndTime()));
            }
        }
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
