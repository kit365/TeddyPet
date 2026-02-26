package fpt.teddypet.infrastructure.persistence.postgres.repository.staff;

import fpt.teddypet.domain.entity.staff.StaffSkill;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StaffSkillRepository extends JpaRepository<StaffSkill, Long> {

    List<StaffSkill> findByStaff_Id(Long staffId);
}

