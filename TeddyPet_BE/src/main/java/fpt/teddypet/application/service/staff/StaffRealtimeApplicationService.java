package fpt.teddypet.application.service.staff;

import fpt.teddypet.application.dto.response.staff.StaffRealtimeResponse;
import fpt.teddypet.application.port.input.staff.StaffRealtimeService;
import fpt.teddypet.application.port.output.staff.StaffProfileRepositoryPort;
import fpt.teddypet.application.port.output.staff.StaffRealtimeRepositoryPort;
import fpt.teddypet.domain.entity.staff.StaffProfile;
import fpt.teddypet.domain.entity.staff.StaffRealtime;
import fpt.teddypet.domain.enums.staff.StaffRealtimeStatusEnum;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StaffRealtimeApplicationService implements StaffRealtimeService {

    private final StaffRealtimeRepositoryPort staffRealtimeRepositoryPort;
    private final StaffProfileRepositoryPort staffProfileRepositoryPort;

    @Override
    public StaffRealtimeResponse getByStaffId(Long staffId) {
        StaffRealtime realtime = getOrCreateRealtime(staffId);
        return toResponse(realtime);
    }

    @Override
    @Transactional
    public StaffRealtimeResponse updateStatus(Long staffId, StaffRealtimeStatusEnum status, UUID currentBookingId) {
        StaffRealtime realtime = getOrCreateRealtime(staffId);
        realtime.setCurrentStatus(status);
        realtime.setCurrentBookingId(currentBookingId);
        realtime.setLastUpdated(LocalDateTime.now());
        StaffRealtime saved = staffRealtimeRepositoryPort.save(realtime);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public StaffRealtimeResponse markAvailable(Long staffId) {
        return updateStatus(staffId, StaffRealtimeStatusEnum.AVAILABLE, null);
    }

    @Override
    @Transactional
    public StaffRealtimeResponse markBusy(Long staffId, UUID bookingId) {
        return updateStatus(staffId, StaffRealtimeStatusEnum.BUSY, bookingId);
    }

    @Override
    @Transactional
    public StaffRealtimeResponse markOffline(Long staffId) {
        return updateStatus(staffId, StaffRealtimeStatusEnum.OFFLINE, null);
    }

    @Override
    @Transactional
    public StaffRealtimeResponse markOnBreak(Long staffId) {
        return updateStatus(staffId, StaffRealtimeStatusEnum.ON_BREAK, null);
    }

    private StaffRealtime getOrCreateRealtime(Long staffId) {
        return staffRealtimeRepositoryPort.findByStaffId(staffId)
                .orElseGet(() -> {
                    StaffProfile staff = staffProfileRepositoryPort.findById(staffId)
                            .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy nhân viên với id: " + staffId));
                    StaffRealtime realtime = StaffRealtime.builder()
                            .staff(staff)
                            .currentStatus(StaffRealtimeStatusEnum.OFFLINE)
                            .lastUpdated(LocalDateTime.now())
                            .build();
                    return staffRealtimeRepositoryPort.save(realtime);
                });
    }

    private StaffRealtimeResponse toResponse(StaffRealtime realtime) {
        return new StaffRealtimeResponse(
                realtime.getStaff().getId(),
                realtime.getCurrentStatus(),
                realtime.getCurrentBookingId(),
                realtime.getLastUpdated()
        );
    }
}

