package fpt.teddypet.application.service.staff;

import fpt.teddypet.application.dto.request.staff.SkillRequest;
import fpt.teddypet.application.dto.response.staff.SkillResponse;
import fpt.teddypet.application.port.input.staff.SkillService;
import fpt.teddypet.application.port.output.staff.SkillRepositoryPort;
import fpt.teddypet.domain.entity.staff.Skill;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SkillApplicationService implements SkillService {

    private final SkillRepositoryPort skillRepositoryPort;

    @Override
    @Transactional
    public SkillResponse create(SkillRequest request) {
        if (skillRepositoryPort.existsByCode(request.code())) {
            throw new IllegalArgumentException("Mã kỹ năng đã tồn tại: " + request.code());
        }
        Skill skill = Skill.builder()
                .code(request.code())
                .name(request.name())
                .description(request.description())
                .build();
        Skill saved = skillRepositoryPort.save(skill);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public SkillResponse update(Long id, SkillRequest request) {
        Skill existing = getActiveById(id);

        if (!existing.getCode().equals(request.code()) && skillRepositoryPort.existsByCode(request.code())) {
            throw new IllegalArgumentException("Mã kỹ năng đã tồn tại: " + request.code());
        }

        existing.setCode(request.code());
        existing.setName(request.name());
        existing.setDescription(request.description());

        Skill saved = skillRepositoryPort.save(existing);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Skill existing = getActiveById(id);
        // soft delete theo BaseEntity
        existing.setDeleted(true);
        existing.setActive(false);
        skillRepositoryPort.save(existing);
    }

    @Override
    public SkillResponse getById(Long id) {
        return toResponse(getActiveById(id));
    }

    @Override
    public List<SkillResponse> getAllActive() {
        return skillRepositoryPort.findAllActive()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private Skill getActiveById(Long id) {
        return skillRepositoryPort.findById(id)
                .filter(s -> !s.isDeleted() && s.isActive())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy kỹ năng với id: " + id));
    }

    private SkillResponse toResponse(Skill skill) {
        return new SkillResponse(
                skill.getId(),
                skill.getCode(),
                skill.getName(),
                skill.getDescription(),
                skill.isActive()
        );
    }
}

