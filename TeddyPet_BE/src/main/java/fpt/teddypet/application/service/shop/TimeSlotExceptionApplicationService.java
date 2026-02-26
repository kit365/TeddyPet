package fpt.teddypet.application.service.shop;

import fpt.teddypet.application.constants.shop.ShopMessages;
import fpt.teddypet.application.dto.request.shop.TimeSlotExceptionUpsertRequest;
import fpt.teddypet.application.dto.response.shop.TimeSlotExceptionResponse;
import fpt.teddypet.application.mapper.shop.TimeSlotExceptionMapper;
import fpt.teddypet.application.port.input.shop.TimeSlotExceptionService;
import fpt.teddypet.application.port.output.shop.TimeSlotExceptionRepositoryPort;
import fpt.teddypet.domain.entity.TimeSlotException;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.ConstraintViolationException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TimeSlotExceptionApplicationService implements TimeSlotExceptionService {

    private final TimeSlotExceptionRepositoryPort repository;
    private final TimeSlotExceptionMapper mapper;

    @Override
    public List<TimeSlotExceptionResponse> getAll() {
        return repository.findAllActive().stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    public List<TimeSlotExceptionResponse> getByServiceId(Long serviceId) {
        return repository.findByServiceId(serviceId).stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    public TimeSlotExceptionResponse getById(Long id) {
        return mapper.toResponse(getEntity(id));
    }

    @Override
    @Transactional
    public void upsert(TimeSlotExceptionUpsertRequest request) {
        if (request.endDate().isBefore(request.startDate())) {
            throw new ConstraintViolationException("Ngày kết thúc phải sau hoặc bằng ngày bắt đầu", null);
        }

        TimeSlotException entity;
        if (request.id() != null) {
            entity = getEntity(request.id());
        } else {
            entity = TimeSlotException.builder().build();
            entity.setDeleted(false);
            entity.setActive(true);
        }

        mapper.updateFromRequest(request, entity);
        entity.setServiceId(request.serviceId());
        entity.setTimeExceptionName(request.timeExceptionName());
        entity.setStartDate(request.startDate());
        entity.setEndDate(request.endDate());
        entity.setScope(request.serviceId() == null ? "STORE" : "SERVICE");
        entity.setExceptionType(request.exceptionType());
        entity.setReason(request.reason());
        entity.setIsRecurring(Boolean.TRUE.equals(request.isRecurring()));
        entity.setRecurrencePattern(request.recurrencePattern());
        repository.save(entity);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        TimeSlotException entity = getEntity(id);
        entity.setDeleted(true);
        entity.setActive(false);
        repository.save(entity);
    }

    private TimeSlotException getEntity(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        String.format(ShopMessages.MESSAGE_TIME_SLOT_EXCEPTION_NOT_FOUND, id)));
    }
}
