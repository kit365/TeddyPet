package fpt.teddypet.application.service.shop;

import fpt.teddypet.application.constants.shop.ShopMessages;
import fpt.teddypet.application.dto.request.shop.ShopOperationHourUpsertRequest;
import fpt.teddypet.application.dto.response.shop.ShopOperationHourResponse;
import fpt.teddypet.application.mapper.shop.ShopOperationHourMapper;
import fpt.teddypet.application.port.input.shop.ShopOperationHourService;
import fpt.teddypet.application.port.output.shop.ShopOperationHourRepositoryPort;
import fpt.teddypet.domain.entity.ShopOperationHour;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ShopOperationHourApplicationService implements ShopOperationHourService {

    private final ShopOperationHourRepositoryPort repository;
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
    }

    @Override
    @Transactional
    public void upsertAll(List<ShopOperationHourUpsertRequest> requests) {
        for (ShopOperationHourUpsertRequest req : requests) {
            upsert(req);
        }
    }

    private ShopOperationHour getEntity(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cấu hình giờ hoạt động"));
    }
}
