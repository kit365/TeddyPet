package fpt.teddypet.infrastructure.persistence.postgres.repository.staff;

import fpt.teddypet.domain.entity.staff.StaffSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface StaffSkillRepository extends JpaRepository<StaffSkill, Long> {

    List<StaffSkill> findByStaff_Id(Long staffId);

    /** Nhân viên (trong tập staffIds) đang có kỹ năng skillId, còn hiệu lực. */
    @Query("SELECT DISTINCT ss.staff.id FROM StaffSkill ss WHERE ss.skill.id = :skillId "
            + "AND ss.staff.id IN :staffIds AND ss.isDeleted = false AND ss.isActive = true")
    List<Long> findStaffIdsHavingSkill(
            @Param("skillId") Long skillId,
            @Param("staffIds") Collection<Long> staffIds);
}

