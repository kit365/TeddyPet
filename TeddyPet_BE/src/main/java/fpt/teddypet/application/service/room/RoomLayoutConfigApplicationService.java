package fpt.teddypet.application.service.room;

import fpt.teddypet.application.dto.request.room.RoomLayoutConfigUpsertRequest;
import fpt.teddypet.application.dto.response.room.RoomLayoutConfigResponse;
import fpt.teddypet.application.port.input.room.RoomLayoutConfigService;
import fpt.teddypet.application.port.output.room.RoomLayoutConfigRepositoryPort;
import fpt.teddypet.domain.entity.RoomLayoutConfig;
import fpt.teddypet.domain.entity.Service;
import fpt.teddypet.domain.enums.RoomLayoutStatusEnum;
import fpt.teddypet.infrastructure.persistence.postgres.repository.services.ServiceRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@org.springframework.stereotype.Service
@RequiredArgsConstructor
public class RoomLayoutConfigApplicationService implements RoomLayoutConfigService {

    private final RoomLayoutConfigRepositoryPort repositoryPort;
    private final ServiceRepository serviceRepository;

    @Override
    public List<RoomLayoutConfigResponse> getAll() {
        return repositoryPort.findAll().stream().map(this::toResponse).toList();
    }

    @Override
    public RoomLayoutConfigResponse getById(Long id) {
        return toResponse(getEntityById(id));
    }

    @Override
    @Transactional
    public RoomLayoutConfigResponse create(RoomLayoutConfigUpsertRequest request) {
        RoomLayoutConfig entity = RoomLayoutConfig.builder()
                .layoutName(request.layoutName() != null ? request.layoutName().trim() : null)
                .maxRows(request.maxRows())
                .maxCols(request.maxCols())
                .backgroundImage(request.backgroundImage() != null ? request.backgroundImage().trim() : null)
                .status(RoomLayoutStatusEnum.NO_ROOMS_IS_SORTED)
                .build();

        if (request.serviceId() != null) {
            Service service = serviceRepository.findById(request.serviceId())
                    .orElseThrow(
                            () -> new EntityNotFoundException("Không tìm thấy dịch vụ với ID: " + request.serviceId()));
            if (!Boolean.TRUE.equals(service.getIsRequiredRoom())) {
                throw new IllegalArgumentException("Dịch vụ này không yêu cầu phòng (isRequiredRoom=false).");
            }
            entity.setService(service);
        }

        entity = repositoryPort.save(entity);
        return toResponse(entity);
    }

    @Override
    @Transactional
    public RoomLayoutConfigResponse update(RoomLayoutConfigUpsertRequest request) {
        if (request.id() == null)
            throw new IllegalArgumentException("ID layout là bắt buộc khi cập nhật");
        RoomLayoutConfig entity = getEntityById(request.id());
        entity.setLayoutName(request.layoutName() != null ? request.layoutName().trim() : null);
        entity.setMaxRows(request.maxRows());
        entity.setMaxCols(request.maxCols());
        entity.setBackgroundImage(request.backgroundImage() != null ? request.backgroundImage().trim() : null);

        if (request.serviceId() != null) {
            Service service = serviceRepository.findById(request.serviceId())
                    .orElseThrow(
                            () -> new EntityNotFoundException("Không tìm thấy dịch vụ với ID: " + request.serviceId()));
            if (!Boolean.TRUE.equals(service.getIsRequiredRoom())) {
                throw new IllegalArgumentException("Dịch vụ này không yêu cầu phòng (isRequiredRoom=false).");
            }
            entity.setService(service);
        } else {
            entity.setService(null);
        }

        entity = repositoryPort.save(entity);
        return toResponse(entity);
    }

    @Override
    @Transactional
    public RoomLayoutConfigResponse updateStatus(Long id, String status) {
        RoomLayoutConfig entity = getEntityById(id);
        RoomLayoutStatusEnum statusEnum;
        try {
            statusEnum = RoomLayoutStatusEnum.valueOf(status);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Trạng thái không hợp lệ: " + status);
        }
        entity.setStatus(statusEnum);
        entity = repositoryPort.save(entity);
        return toResponse(entity);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        getEntityById(id);
        repositoryPort.deleteById(id);
    }

    private RoomLayoutConfig getEntityById(Long id) {
        return repositoryPort.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cấu hình layout với ID: " + id));
    }

    private RoomLayoutConfigResponse toResponse(RoomLayoutConfig e) {
        return new RoomLayoutConfigResponse(
                e.getId(),
                e.getLayoutName(),
                e.getMaxRows(),
                e.getMaxCols(),
                e.getBackgroundImage(),
                e.getStatus() != null ? e.getStatus().name() : null,
                e.getService() != null ? e.getService().getId() : null,
                e.getService() != null ? e.getService().getServiceName() : null,
                e.getCreatedAt(),
                e.getUpdatedAt());
    }
}
