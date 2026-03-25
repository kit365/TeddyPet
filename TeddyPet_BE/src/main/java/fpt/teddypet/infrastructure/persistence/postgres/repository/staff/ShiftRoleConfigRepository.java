package fpt.teddypet.infrastructure.persistence.postgres.repository.staff;

import fpt.teddypet.domain.entity.staff.ShiftRoleConfig;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ShiftRoleConfigRepository extends JpaRepository<ShiftRoleConfig, Long> {

    Optional<ShiftRoleConfig> findByWorkShift_IdAndPosition_Id(Long workShiftId, Long positionId);

    List<ShiftRoleConfig> findByWorkShift_Id(Long workShiftId);

    void deleteByWorkShift_Id(Long workShiftId);
}
