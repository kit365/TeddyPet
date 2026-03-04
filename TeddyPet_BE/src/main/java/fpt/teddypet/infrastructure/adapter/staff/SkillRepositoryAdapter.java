package fpt.teddypet.infrastructure.adapter.staff;

import fpt.teddypet.application.port.output.staff.SkillRepositoryPort;
import fpt.teddypet.domain.entity.staff.Skill;
import fpt.teddypet.infrastructure.persistence.postgres.repository.staff.SkillRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class SkillRepositoryAdapter implements SkillRepositoryPort {

    private final SkillRepository skillRepository;

    @Override
    public Skill save(Skill skill) {
        return skillRepository.save(skill);
    }

    @Override
    public Optional<Skill> findById(Long id) {
        return skillRepository.findById(id);
    }

    @Override
    public Optional<Skill> findByCode(String code) {
        return skillRepository.findByCode(code);
    }

    @Override
    public boolean existsByCode(String code) {
        return skillRepository.existsByCode(code);
    }

    @Override
    public List<Skill> findAllActive() {
        return skillRepository.findAllActive();
    }
}

