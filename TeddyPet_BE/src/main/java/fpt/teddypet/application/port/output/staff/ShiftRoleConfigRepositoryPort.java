package fpt.teddypet.application.port.output.staff;

import fpt.teddypet.domain.entity.staff.ShiftRoleConfig;

import java.util.List;
import java.util.Optional;

public interface ShiftRoleConfigRepositoryPort {

    Optional<ShiftRoleConfig> findByWorkShiftIdAndPositionId(Long workShiftId, Long positionId);

    List<ShiftRoleConfig> findByWorkShiftId(Long workShiftId);

    ShiftRoleConfig save(ShiftRoleConfig config);

    void deleteAll();

    void deleteByWorkShiftId(Long workShiftId);

    void flush();
}
