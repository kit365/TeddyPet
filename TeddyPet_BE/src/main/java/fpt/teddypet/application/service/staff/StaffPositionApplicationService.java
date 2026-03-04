package fpt.teddypet.application.service.staff;

import fpt.teddypet.application.dto.request.staff.StaffPositionRequest;
import fpt.teddypet.application.dto.response.staff.StaffPositionResponse;
import fpt.teddypet.application.port.input.staff.StaffPositionService;
import fpt.teddypet.application.port.output.staff.StaffPositionRepositoryPort;
import fpt.teddypet.domain.entity.staff.StaffPosition;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StaffPositionApplicationService implements StaffPositionService {

    private final StaffPositionRepositoryPort staffPositionRepositoryPort;

    @Override
    @Transactional
    public StaffPositionResponse create(StaffPositionRequest request) {
        if (staffPositionRepositoryPort.existsByCode(request.code())) {
            throw new IllegalArgumentException("Mã chức vụ đã tồn tại: " + request.code());
        }
        StaffPosition position = StaffPosition.builder()
                .code(request.code())
                .name(request.name())
                .description(request.description())
                .build();
        StaffPosition saved = staffPositionRepositoryPort.save(position);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public StaffPositionResponse update(Long id, StaffPositionRequest request) {
        StaffPosition existing = getActiveById(id);
        if (!existing.getCode().equals(request.code()) && staffPositionRepositoryPort.existsByCode(request.code())) {
            throw new IllegalArgumentException("Mã chức vụ đã tồn tại: " + request.code());
        }
        existing.setCode(request.code());
        existing.setName(request.name());
        existing.setDescription(request.description());
        StaffPosition saved = staffPositionRepositoryPort.save(existing);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        StaffPosition existing = getActiveById(id);
        existing.setDeleted(true);
        existing.setActive(false);
        staffPositionRepositoryPort.save(existing);
    }

    @Override
    public StaffPositionResponse getById(Long id) {
        return toResponse(getActiveById(id));
    }

    @Override
    public List<StaffPositionResponse> getAllActive() {
        return staffPositionRepositoryPort.findAllActive()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private StaffPosition getActiveById(Long id) {
        return staffPositionRepositoryPort.findById(id)
                .filter(p -> !p.isDeleted() && p.isActive())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy chức vụ với id: " + id));
    }

    private StaffPositionResponse toResponse(StaffPosition position) {
        return new StaffPositionResponse(
                position.getId(),
                position.getCode(),
                position.getName(),
                position.getDescription(),
                position.isActive()
        );
    }
}
