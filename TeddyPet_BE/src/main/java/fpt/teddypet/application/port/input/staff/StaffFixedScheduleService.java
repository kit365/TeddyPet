package fpt.teddypet.application.port.input.staff;

import fpt.teddypet.application.dto.request.staff.StaffFixedScheduleRequest;
import fpt.teddypet.application.dto.response.staff.StaffFixedScheduleResponse;

import java.util.List;

public interface StaffFixedScheduleService {

    StaffFixedScheduleResponse create(StaffFixedScheduleRequest request);

    List<StaffFixedScheduleResponse> getByStaffId(Long staffId);

    void delete(Long scheduleId);
}
