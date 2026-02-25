package fpt.teddypet.application.service.room;

import fpt.teddypet.application.dto.request.room.RoomLayoutConfigUpsertRequest;
import fpt.teddypet.application.dto.response.room.RoomLayoutConfigResponse;
import fpt.teddypet.application.port.input.room.RoomLayoutConfigService;
import fpt.teddypet.application.port.output.room.RoomLayoutConfigRepositoryPort;
import fpt.teddypet.domain.entity.RoomLayoutConfig;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RoomLayoutConfigApplicationService implements RoomLayoutConfigService {

    private final RoomLayoutConfigRepositoryPort repositoryPort;

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
                .block(request.block() != null ? request.block().trim() : null)
                .maxRows(request.maxRows())
                .maxCols(request.maxCols())
                .floor(request.floor() != null ? request.floor().trim() : null)
                .backgroundImage(request.backgroundImage() != null ? request.backgroundImage().trim() : null)
                .build();
        entity = repositoryPort.save(entity);
        return toResponse(entity);
    }

    @Override
    @Transactional
    public RoomLayoutConfigResponse update(RoomLayoutConfigUpsertRequest request) {
        if (request.id() == null) throw new IllegalArgumentException("ID layout là bắt buộc khi cập nhật");
        RoomLayoutConfig entity = getEntityById(request.id());
        entity.setLayoutName(request.layoutName() != null ? request.layoutName().trim() : null);
        entity.setBlock(request.block() != null ? request.block().trim() : null);
        entity.setMaxRows(request.maxRows());
        entity.setMaxCols(request.maxCols());
        entity.setFloor(request.floor() != null ? request.floor().trim() : null);
        entity.setBackgroundImage(request.backgroundImage() != null ? request.backgroundImage().trim() : null);
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
                e.getBlock(),
                e.getMaxRows(),
                e.getMaxCols(),
                e.getFloor(),
                e.getBackgroundImage(),
                e.getCreatedAt(),
                e.getUpdatedAt()
        );
    }
}
