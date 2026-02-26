package fpt.teddypet.application.port.input.staff;

import fpt.teddypet.application.dto.request.staff.OpenShiftRequest;
import fpt.teddypet.application.dto.response.staff.WorkShiftRegistrationResponse;
import fpt.teddypet.application.dto.response.staff.WorkShiftResponse;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Service quản lý ca làm việc theo luồng Open Shifts + Shift Bidding.
 */
public interface WorkShiftService {

    /** Admin: Tạo ca trống (status = OPEN, staff = null) */
    WorkShiftResponse createOpenShift(OpenShiftRequest request);

    /** Staff: Lấy danh sách ca trống có thể đăng ký */
    List<WorkShiftResponse> getAvailableShifts(LocalDateTime from, LocalDateTime to);

    /** Staff: Đăng ký ca làm việc (tạo WorkShiftRegistration status PENDING) */
    WorkShiftRegistrationResponse registerForShift(Long shiftId, Long staffId);

    /** Admin: Lấy danh sách đăng ký của một ca */
    List<WorkShiftRegistrationResponse> getRegistrationsForShift(Long shiftId);

    /** Admin: Duyệt đăng ký - gán nhân viên cho ca, reject các đăng ký khác */
    WorkShiftResponse approveRegistration(Long shiftId, Long registrationId);

    /** Lấy chi tiết ca làm việc theo id */
    WorkShiftResponse getById(Long shiftId);

    /** Lấy danh sách ca làm việc của nhân viên trong khoảng thời gian */
    List<WorkShiftResponse> getByStaffAndDateRange(Long staffId, LocalDateTime from, LocalDateTime to);
}
