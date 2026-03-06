package fpt.teddypet.application.port.input.staff;

import fpt.teddypet.application.dto.request.staff.OpenShiftRequest;
import fpt.teddypet.application.dto.request.staff.ShiftRoleConfigItemRequest;
import fpt.teddypet.application.dto.response.staff.AvailableShiftForStaffResponse;
import fpt.teddypet.application.dto.response.staff.ShiftRoleConfigResponse;
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

    /** Admin: Tạo nhiều ca trống cùng lúc (cho tuần chuẩn). Có thể chỉnh sửa/xóa từng ca sau. */
    List<WorkShiftResponse> createOpenShiftsBatch(List<OpenShiftRequest> requests);

    /** Admin: Cập nhật ca trống (chỉ khi status = OPEN) */
    WorkShiftResponse updateOpenShift(Long shiftId, OpenShiftRequest request);

    /** Admin: Hủy/Xóa ca trống (chỉ khi status = OPEN, chưa gán nhân viên) */
    void cancelOpenShift(Long shiftId);

    /** Admin: Xóa tất cả ca làm (và đăng ký, định mức role) – dùng để tạo lại từ đầu */
    void deleteAllWorkShifts();

    /** Admin: Lấy tất cả ca trong khoảng (OPEN + ASSIGNED) để hiển thị grid, kể cả ca đã khóa sau Duyệt lần cuối */
    List<WorkShiftResponse> getShiftsForAdminByDateRange(LocalDateTime from, LocalDateTime to);

    /** Staff: Lấy danh sách ca trống có thể đăng ký */
    List<WorkShiftResponse> getAvailableShifts(LocalDateTime from, LocalDateTime to);

    /** Staff: Lấy ca trống kèm thông tin slot theo vai trò (để Part-time biết còn chỗ đăng ký; Full-time không dùng đăng ký). */
    List<AvailableShiftForStaffResponse> getAvailableShiftsForStaff(LocalDateTime from, LocalDateTime to);

    /** Staff: Đăng ký ca làm việc (chỉ Part-time; Full-time bị từ chối). */
    WorkShiftRegistrationResponse registerForShift(Long shiftId, Long staffId);

    /** Staff (Full-time): Xin nghỉ ca – chuyển đăng ký APPROVED sang PENDING_LEAVE (chờ admin duyệt). */
    WorkShiftRegistrationResponse requestLeave(Long shiftId, Long staffId);

    /** Staff (Part-time): Hủy đăng ký ca (hoàn tác) – xóa bản ghi PENDING. */
    void cancelMyRegistration(Long shiftId, Long staffId);

    /** Staff (Full-time): Hoàn tác xin nghỉ – chuyển PENDING_LEAVE hoặc ON_LEAVE về APPROVED. */
    WorkShiftRegistrationResponse undoLeave(Long shiftId, Long staffId);

    /** Staff: Lấy danh sách đăng ký ca (PENDING) của nhân viên đang đăng nhập, có thể lọc theo khoảng thời gian ca */
    List<WorkShiftRegistrationResponse> getMyRegistrations(Long staffId, LocalDateTime from, LocalDateTime to);

    /** Admin: Lấy danh sách đăng ký của một ca */
    List<WorkShiftRegistrationResponse> getRegistrationsForShift(Long shiftId);

    /** Admin: Duyệt đăng ký - gán nhân viên cho ca */
    WorkShiftResponse approveRegistration(Long shiftId, Long registrationId);

    /** Admin: Duyệt xin nghỉ hoặc đánh dấu nghỉ phép – chuyển APPROVED/PENDING_LEAVE sang ON_LEAVE, nhả 1 slot cho Part-time đăng ký bù. */
    WorkShiftRegistrationResponse setRegistrationOnLeave(Long shiftId, Long registrationId);

    /** Admin: Từ chối xin nghỉ – chuyển PENDING_LEAVE về APPROVED (nhân viên vẫn làm ca). */
    WorkShiftRegistrationResponse rejectLeaveRequest(Long shiftId, Long registrationId);

    /** Lấy chi tiết ca làm việc theo id */
    WorkShiftResponse getById(Long shiftId);

    /** Lấy danh sách ca làm việc của nhân viên trong khoảng thời gian */
    List<WorkShiftResponse> getByStaffAndDateRange(Long staffId, LocalDateTime from, LocalDateTime to);

    /** Admin: Lấy định mức theo vai trò của một ca (số slot tối đa mỗi chức vụ) */
    List<ShiftRoleConfigResponse> getRoleConfigsForShift(Long shiftId);

    /** Admin: Thiết lập định mức theo vai trò cho ca (vd: Thu ngân 1, Spa 2). Chỉ áp dụng cho ca OPEN. */
    List<ShiftRoleConfigResponse> setRoleConfigsForShift(Long shiftId, List<ShiftRoleConfigItemRequest> configs);

    /** Admin: Điền ca theo lịch cố định – tạo định mức mặc định (nếu chưa có) và tạo đăng ký PENDING cho Full-time trùng lịch. */
    void runAutoFillForShift(Long shiftId);

    /** Admin: Duyệt lần cuối – chuyển tất cả đăng ký PENDING của ca sang APPROVED; sau đó "Ca của tôi" mới hiển thị. */
    void finalizeShiftApprovals(Long shiftId);
}
