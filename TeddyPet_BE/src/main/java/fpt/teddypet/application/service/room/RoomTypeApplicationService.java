package fpt.teddypet.application.service.room;

import fpt.teddypet.application.constants.room.RoomTypeMessages;
import fpt.teddypet.application.dto.request.room.RoomTypeUpsertRequest;
import fpt.teddypet.application.dto.response.room.RoomTypeResponse;
import fpt.teddypet.application.mapper.room.RoomTypeMapper;
import fpt.teddypet.application.port.input.room.RoomTypeService;
import fpt.teddypet.application.port.output.room.RoomTypeRepositoryPort;
import fpt.teddypet.application.port.output.services.ServiceRepositoryPort;
import fpt.teddypet.application.util.SlugUtil;
import fpt.teddypet.application.util.ValidationUtils;
import fpt.teddypet.domain.entity.RoomType;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RoomTypeApplicationService implements RoomTypeService {

    private final RoomTypeRepositoryPort roomTypeRepositoryPort;
    private final ServiceRepositoryPort serviceRepositoryPort;
    private final RoomTypeMapper roomTypeMapper;

    @Override
    @Transactional
    public RoomTypeResponse upsert(RoomTypeUpsertRequest request) {
        RoomType entity;
        boolean isNew = request.roomTypeId() == null;

        if (isNew) {
            entity = RoomType.builder().build();
            entity.setDeleted(false);
        } else {
            entity = roomTypeRepositoryPort.findById(request.roomTypeId())
                    .orElseThrow(() -> new EntityNotFoundException(
                            String.format(RoomTypeMessages.MESSAGE_ROOM_TYPE_NOT_FOUND_BY_ID, request.roomTypeId())));
        }

        roomTypeMapper.updateRoomTypeFromRequest(request, entity);

        // Service mapping is now many-to-many via ServiceRoomType, handled elsewhere.

        if (request.slug() != null && !request.slug().isBlank()) {
            String slug = request.slug().trim();
            ValidationUtils.ensureUnique(
                    () -> roomTypeRepositoryPort.existsBySlugAndIdNot(slug, isNew ? -1L : entity.getId()),
                    "Slug '" + slug + "' đã tồn tại."
            );
            entity.setSlug(slug);
        } else if (request.typeName() != null && !request.typeName().isBlank()) {
            String slug = SlugUtil.toSlug(request.typeName());
            ValidationUtils.ensureUnique(
                    () -> roomTypeRepositoryPort.existsBySlugAndIdNot(slug, isNew ? -1L : entity.getId()),
                    "Slug '" + slug + "' đã tồn tại."
            );
            entity.setSlug(slug);
        }

        RoomType saved = roomTypeRepositoryPort.save(entity);
        return roomTypeMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public RoomTypeResponse getById(Long id) {
        return roomTypeMapper.toResponse(getEntityById(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<RoomTypeResponse> getAll(Long serviceId) {
        List<RoomType> list = roomTypeRepositoryPort.findByServiceId(serviceId);
        return list.stream().map(roomTypeMapper::toResponse).toList();
    }

    @Override
    @Transactional
    public void updateServiceId(Long roomTypeId, Long serviceId) {
        RoomType entity = getEntityById(roomTypeId);
        // Service mapping is now many-to-many via ServiceRoomType, handled elsewhere.
    }

    @Override
    @Transactional
    public void delete(Long id) {
        RoomType entity = getEntityById(id);
        entity.setDeleted(true);
        entity.setActive(false);
        roomTypeRepositoryPort.save(entity);
    }

    private RoomType getEntityById(Long id) {
        return roomTypeRepositoryPort.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        String.format(RoomTypeMessages.MESSAGE_ROOM_TYPE_NOT_FOUND_BY_ID, id)));
    }
}
