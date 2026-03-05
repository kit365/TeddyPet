package fpt.teddypet.infrastructure.adapter.staff;

import fpt.teddypet.application.port.output.staff.StaffRealtimeRepositoryPort;
import fpt.teddypet.domain.entity.staff.StaffRealtime;
import fpt.teddypet.infrastructure.persistence.postgres.repository.staff.StaffRealtimeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
public class StaffRealtimeRepositoryAdapter implements StaffRealtimeRepositoryPort {

    private final StaffRealtimeRepository staffRealtimeRepository;

    @Override
    public StaffRealtime save(StaffRealtime staffRealtime) {
        return staffRealtimeRepository.save(staffRealtime);
    }

    @Override
    public Optional<StaffRealtime> findByStaffId(Long staffId) {
        return staffRealtimeRepository.findByStaff_Id(staffId);
    }
}

