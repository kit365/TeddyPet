package fpt.teddypet.application.service.staff;

import fpt.teddypet.application.dto.request.staff.StaffSkillRequest;
import fpt.teddypet.application.dto.response.staff.StaffSkillResponse;
import fpt.teddypet.application.port.input.staff.StaffSkillService;
import fpt.teddypet.application.port.output.staff.SkillRepositoryPort;
import fpt.teddypet.application.port.output.staff.StaffProfileRepositoryPort;
import fpt.teddypet.application.port.output.staff.StaffSkillRepositoryPort;
import fpt.teddypet.domain.entity.staff.Skill;
import fpt.teddypet.domain.entity.staff.StaffProfile;
import fpt.teddypet.domain.entity.staff.StaffSkill;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StaffSkillApplicationService implements StaffSkillService {

    private final StaffSkillRepositoryPort staffSkillRepositoryPort;
    private final StaffProfileRepositoryPort staffProfileRepositoryPort;
    private final SkillRepositoryPort skillRepositoryPort;

    @Override
    @Transactional
    public StaffSkillResponse create(StaffSkillRequest request) {
        StaffProfile staff = staffProfileRepositoryPort.findById(request.staffId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy nhân viên với id: " + request.staffId()));

        Skill skill = skillRepositoryPort.findById(request.skillId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy kỹ năng với id: " + request.skillId()));

        StaffSkill staffSkill = StaffSkill.builder()
                .staff(staff)
                .skill(skill)
                .proficiencyLevel(request.proficiencyLevel())
                .commissionRate(request.commissionRate())
                .build();

        StaffSkill saved = staffSkillRepositoryPort.save(staffSkill);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public StaffSkillResponse update(Long id, StaffSkillRequest request) {
        StaffSkill existing = getActiveById(id);

        // Cho phép đổi nhân viên / kỹ năng nếu cần
        if (!existing.getStaff().getId().equals(request.staffId())) {
            StaffProfile staff = staffProfileRepositoryPort.findById(request.staffId())
                    .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy nhân viên với id: " + request.staffId()));
            existing.setStaff(staff);
        }

        if (!existing.getSkill().getId().equals(request.skillId())) {
            Skill skill = skillRepositoryPort.findById(request.skillId())
                    .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy kỹ năng với id: " + request.skillId()));
            existing.setSkill(skill);
        }

        existing.setProficiencyLevel(request.proficiencyLevel());
        existing.setCommissionRate(request.commissionRate());

        StaffSkill saved = staffSkillRepositoryPort.save(existing);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        StaffSkill existing = getActiveById(id);
        existing.setActive(false);
        existing.setDeleted(true);
        staffSkillRepositoryPort.save(existing);
    }

    @Override
    public StaffSkillResponse getById(Long id) {
        return toResponse(getActiveById(id));
    }

    @Override
    public List<StaffSkillResponse> getByStaffId(Long staffId) {
        return staffSkillRepositoryPort.findByStaffId(staffId).stream()
                .filter(s -> !s.isDeleted() && s.isActive())
                .map(this::toResponse)
                .toList();
    }

    private StaffSkill getActiveById(Long id) {
        return staffSkillRepositoryPort.findById(id)
                .filter(s -> !s.isDeleted() && s.isActive())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy kỹ năng nhân viên với id: " + id));
    }

    private StaffSkillResponse toResponse(StaffSkill staffSkill) {
        return new StaffSkillResponse(
                staffSkill.getId(),
                staffSkill.getStaff().getId(),
                staffSkill.getSkill().getId(),
                staffSkill.getSkill().getCode(),
                staffSkill.getSkill().getName(),
                staffSkill.getProficiencyLevel(),
                staffSkill.getCommissionRate(),
                staffSkill.isActive()
        );
    }
}

