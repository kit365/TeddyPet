package fpt.teddypet.application.port.output.staff;

import fpt.teddypet.domain.entity.staff.StaffRealtime;

import java.util.Optional;

public interface StaffRealtimeRepositoryPort {

    StaffRealtime save(StaffRealtime staffRealtime);

    Optional<StaffRealtime> findByStaffId(Long staffId);
}

