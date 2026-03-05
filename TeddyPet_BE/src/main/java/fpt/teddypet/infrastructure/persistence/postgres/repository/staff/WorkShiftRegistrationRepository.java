package fpt.teddypet.infrastructure.persistence.postgres.repository.staff;

import fpt.teddypet.domain.entity.staff.WorkShiftRegistration;
import fpt.teddypet.domain.enums.staff.RegistrationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WorkShiftRegistrationRepository extends JpaRepository<WorkShiftRegistration, Long> {

    List<WorkShiftRegistration> findByWorkShift_IdOrderByRegisteredAtAsc(Long workShiftId);

    boolean existsByWorkShift_IdAndStaff_Id(Long workShiftId, Long staffId);

    Optional<WorkShiftRegistration> findByIdAndWorkShift_Id(Long registrationId, Long workShiftId);
}
