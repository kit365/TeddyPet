package fpt.teddypet.infrastructure.adapter.staff;

import fpt.teddypet.application.port.output.staff.StaffPositionRepositoryPort;
import fpt.teddypet.domain.entity.staff.StaffPosition;
import fpt.teddypet.infrastructure.persistence.postgres.repository.staff.StaffPositionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class StaffPositionRepositoryAdapter implements StaffPositionRepositoryPort {

    private final StaffPositionRepository staffPositionRepository;

    @Override
    public StaffPosition save(StaffPosition position) {
        return staffPositionRepository.save(position);
    }

    @Override
    public Optional<StaffPosition> findById(Long id) {
        return staffPositionRepository.findById(id);
    }

    @Override
    public Optional<StaffPosition> findByCode(String code) {
        return staffPositionRepository.findByCode(code);
    }

    @Override
    public boolean existsByCode(String code) {
        return staffPositionRepository.existsByCode(code);
    }

    @Override
    public List<StaffPosition> findAllActive() {
        return staffPositionRepository.findAllActive();
    }
}
