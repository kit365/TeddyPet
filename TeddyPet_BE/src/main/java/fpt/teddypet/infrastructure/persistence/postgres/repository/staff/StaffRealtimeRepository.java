package fpt.teddypet.infrastructure.persistence.postgres.repository.staff;

import fpt.teddypet.domain.entity.staff.StaffRealtime;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StaffRealtimeRepository extends JpaRepository<StaffRealtime, Long> {

    Optional<StaffRealtime> findByStaff_Id(Long staffId);
}

