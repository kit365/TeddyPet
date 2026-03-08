package fpt.teddypet.application.service.shop;

import fpt.teddypet.application.constants.shop.ShopMessages;
import fpt.teddypet.application.dto.request.shop.ShopOperationHourUpsertRequest;
import fpt.teddypet.application.dto.response.shop.ShopOperationHourResponse;
import fpt.teddypet.application.mapper.shop.ShopOperationHourMapper;
import fpt.teddypet.application.port.input.shop.ShopOperationHourService;
import fpt.teddypet.application.port.output.shop.ShopOperationHourRepositoryPort;
import fpt.teddypet.application.port.output.shop.TimeSlotRepositoryPort;
import fpt.teddypet.domain.entity.TimeSlot;
import fpt.teddypet.domain.entity.ShopOperationHour;
import fpt.teddypet.domain.enums.scheduling.DayTypeEnum;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ShopOperationHourApplicationService implements ShopOperationHourService {

    private final ShopOperationHourRepositoryPort repository;
    private final TimeSlotRepositoryPort timeSlotRepository;
    private final ShopOperationHourMapper mapper;

    @Override
    public List<ShopOperationHourResponse> getAll() {
        return repository.findAllActive().stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    public ShopOperationHourResponse getByDayOfWeek(Integer dayOfWeek) {
        return repository.findByDayOfWeek(dayOfWeek)
                .map(mapper::toResponse)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cấu hình cho thứ " + dayOfWeek));
    }

    @Override
    @Transactional
    public void upsert(ShopOperationHourUpsertRequest request) {
        ShopOperationHour entity;
        if (request.id() != null) {
            entity = getEntity(request.id());
            if (!entity.getDayOfWeek().equals(request.dayOfWeek()) &&
                repository.existsByDayOfWeekAndIdNot(request.dayOfWeek(), request.id())) {
                throw new IllegalArgumentException(
                        String.format(ShopMessages.MESSAGE_OPERATION_HOUR_DAY_EXISTS, request.dayOfWeek()));
            }
        } else {
            entity = repository.findByDayOfWeek(request.dayOfWeek()).orElse(null);
            if (entity == null) {
                entity = ShopOperationHour.builder().build();
                entity.setDeleted(false);
                entity.setActive(true);
            }
        }

        mapper.updateFromRequest(request, entity);
        entity.setDayOfWeek(request.dayOfWeek());
        entity.setIsDayOff(Boolean.TRUE.equals(request.isDayOff()));
        entity.setOpenTime(request.openTime());
        entity.setCloseTime(request.closeTime());
        entity.setBreakStartTime(request.breakStartTime());
        entity.setBreakEndTime(request.breakEndTime());
        repository.save(entity);
        syncTimeSlotsWithOperationHours();
    }

    @Override
    @Transactional
    public void upsertAll(List<ShopOperationHourUpsertRequest> requests) {
        for (ShopOperationHourUpsertRequest req : requests) {
            upsert(req);
        }
    }

    /**
     * After shop operation hours change, ensure all time slots across all services
     * are marked active/inactive according to the new working hours.
     *
     * Rule:
     * - Time slot must be within an open/close window of at least one applicable
     *   ShopOperationHour (based on WEEKDAY/WEEKEND).
     * - And it must NOT overlap with any configured break time for that day.
     * - Otherwise, isActive = false.
     */
    private void syncTimeSlotsWithOperationHours() {
        List<ShopOperationHour> hours = repository.findAllActive();
        if (hours.isEmpty()) {
            return;
        }

        List<TimeSlot> slots = timeSlotRepository.findAllActive();
        if (slots.isEmpty()) {
            return;
        }

        for (TimeSlot slot : slots) {
            boolean active = isSlotWithinOperationHours(slot, hours);
            slot.setActive(active);
            slot.setStatus(active ? "ACTIVE" : "INACTIVE");
        }

        timeSlotRepository.saveAll(slots);
    }

    private boolean isSlotWithinOperationHours(TimeSlot slot, List<ShopOperationHour> hours) {
        DayTypeEnum dayType = slot.getDayType();
        List<ShopOperationHour> applicable;
        switch (dayType) {
            case WEEKDAY -> applicable = hours.stream()
                    .filter(h -> h.getDayOfWeek() != null && h.getDayOfWeek() >= 1 && h.getDayOfWeek() <= 5)
                    .toList();
            case WEEKEND -> applicable = hours.stream()
                    .filter(h -> h.getDayOfWeek() != null && (h.getDayOfWeek() == 6 || h.getDayOfWeek() == 7))
                    .toList();
            default -> applicable = List.of();
        }

        if (applicable.isEmpty()) {
            return false;
        }

        return applicable.stream().anyMatch(h -> isSlotCompatibleWithHour(slot, h));
    }

    private boolean isSlotCompatibleWithHour(TimeSlot slot, ShopOperationHour h) {
        if (Boolean.TRUE.equals(h.getIsDayOff())) {
            return false;
        }
        if (h.getOpenTime() != null && slot.getStartTime().isBefore(h.getOpenTime())) {
            return false;
        }
        if (h.getCloseTime() != null && slot.getEndTime().isAfter(h.getCloseTime())) {
            return false;
        }

        if (h.getBreakStartTime() != null && h.getBreakEndTime() != null) {
            boolean overlapsBreak = slot.getStartTime().isBefore(h.getBreakEndTime())
                    && slot.getEndTime().isAfter(h.getBreakStartTime());
            if (overlapsBreak) {
                return false;
            }
        }
        return true;
    }

    private ShopOperationHour getEntity(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cấu hình giờ hoạt động"));
    }
}
