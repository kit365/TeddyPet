package fpt.teddypet.infrastructure.adapter.staff;

import fpt.teddypet.application.port.output.staff.StaffSkillRepositoryPort;
import fpt.teddypet.domain.entity.staff.StaffSkill;
import fpt.teddypet.infrastructure.persistence.postgres.repository.staff.StaffSkillRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class StaffSkillRepositoryAdapter implements StaffSkillRepositoryPort {

    private final StaffSkillRepository staffSkillRepository;

    @Override
    public StaffSkill save(StaffSkill staffSkill) {
        return staffSkillRepository.save(staffSkill);
    }

    @Override
    public Optional<StaffSkill> findById(Long id) {
        return staffSkillRepository.findById(id);
    }

    @Override
    public List<StaffSkill> findByStaffId(Long staffId) {
        return staffSkillRepository.findByStaff_Id(staffId);
    }

    @Override
    public List<Long> findStaffIdsHavingSkill(Long skillId, Collection<Long> staffIds) {
        if (staffIds == null || staffIds.isEmpty()) {
            return List.of();
        }
        return staffSkillRepository.findStaffIdsHavingSkill(skillId, staffIds);
    }
}

