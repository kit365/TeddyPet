package fpt.teddypet.infrastructure.persistence.postgres.repository.staff;

import fpt.teddypet.domain.entity.staff.Skill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface SkillRepository extends JpaRepository<Skill, Long> {

    Optional<Skill> findByCode(String code);

    boolean existsByCode(String code);

    @Query("SELECT s FROM Skill s WHERE s.isDeleted = false AND s.isActive = true")
    List<Skill> findAllActive();
}

