package fpt.teddypet.application.port.output.staff;

import fpt.teddypet.domain.entity.staff.Skill;

import java.util.List;
import java.util.Optional;

public interface SkillRepositoryPort {

    Skill save(Skill skill);

    Optional<Skill> findById(Long id);

    Optional<Skill> findByCode(String code);

    boolean existsByCode(String code);

    List<Skill> findAllActive();
}

