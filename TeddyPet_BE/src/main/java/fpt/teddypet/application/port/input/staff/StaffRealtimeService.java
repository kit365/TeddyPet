package fpt.teddypet.application.port.input.staff;

import fpt.teddypet.application.dto.response.staff.StaffRealtimeResponse;
import fpt.teddypet.domain.enums.staff.StaffRealtimeStatusEnum;

import java.util.UUID;

public interface StaffRealtimeService {

    StaffRealtimeResponse getByStaffId(Long staffId);

    StaffRealtimeResponse updateStatus(Long staffId, StaffRealtimeStatusEnum status, UUID currentBookingId);

    StaffRealtimeResponse markAvailable(Long staffId);

    StaffRealtimeResponse markBusy(Long staffId, UUID bookingId);

    StaffRealtimeResponse markOffline(Long staffId);

    StaffRealtimeResponse markOnBreak(Long staffId);
}

