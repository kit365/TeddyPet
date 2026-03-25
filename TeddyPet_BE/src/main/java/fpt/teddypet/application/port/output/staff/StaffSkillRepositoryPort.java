package fpt.teddypet.application.port.output.staff;

import fpt.teddypet.domain.entity.staff.StaffSkill;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface StaffSkillRepositoryPort {

    StaffSkill save(StaffSkill staffSkill);

    Optional<StaffSkill> findById(Long id);

    List<StaffSkill> findByStaffId(Long staffId);

    /** Trong danh sách staffIds, những ai có skillId (bản ghi staff_skills còn active). */
    List<Long> findStaffIdsHavingSkill(Long skillId, Collection<Long> staffIds);
}

