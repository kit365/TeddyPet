package fpt.teddypet.infrastructure.adapter.staff;

import fpt.teddypet.application.port.output.staff.ShiftRoleConfigRepositoryPort;
import fpt.teddypet.domain.entity.staff.ShiftRoleConfig;
import fpt.teddypet.infrastructure.persistence.postgres.repository.staff.ShiftRoleConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class ShiftRoleConfigRepositoryAdapter implements ShiftRoleConfigRepositoryPort {

    private final ShiftRoleConfigRepository shiftRoleConfigRepository;

    @Override
    public Optional<ShiftRoleConfig> findByWorkShiftIdAndPositionId(Long workShiftId, Long positionId) {
        return shiftRoleConfigRepository.findByWorkShift_IdAndPosition_Id(workShiftId, positionId);
    }

    @Override
    public List<ShiftRoleConfig> findByWorkShiftId(Long workShiftId) {
        return shiftRoleConfigRepository.findByWorkShift_Id(workShiftId);
    }

    @Override
    public ShiftRoleConfig save(ShiftRoleConfig config) {
        return shiftRoleConfigRepository.save(config);
    }

    @Override
    public void deleteAll() {
        shiftRoleConfigRepository.deleteAll();
    }

    @Override
    public void deleteByWorkShiftId(Long workShiftId) {
        shiftRoleConfigRepository.deleteByWorkShift_Id(workShiftId);
    }

    @Override
    public void flush() {
        shiftRoleConfigRepository.flush();
    }
}
