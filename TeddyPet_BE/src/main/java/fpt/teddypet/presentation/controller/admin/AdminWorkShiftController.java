package fpt.teddypet.presentation.controller.admin;

import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.request.staff.AssignBookingPetServiceStaffRequest;
import fpt.teddypet.application.dto.request.staff.BatchOpenShiftRequest;
import fpt.teddypet.application.dto.request.staff.OpenShiftRequest;
import fpt.teddypet.application.dto.request.staff.ShiftRoleConfigItemRequest;
import fpt.teddypet.application.dto.response.staff.ShiftRoleConfigResponse;
import fpt.teddypet.application.dto.response.staff.WorkShiftAssignedBookingPetServiceResponse;
import fpt.teddypet.application.dto.response.staff.WorkShiftAssignOptionsResponse;
import fpt.teddypet.application.dto.response.staff.WorkShiftBookingPetServicePoolResponse;
import fpt.teddypet.application.dto.response.staff.WorkShiftRegistrationResponse;
import fpt.teddypet.application.dto.response.staff.WorkShiftResponse;
import fpt.teddypet.application.port.input.staff.WorkShiftService;
import fpt.teddypet.presentation.constants.ApiConstants;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

/**
 * Admin API: Tạo ca trống, xem đăng ký, duyệt đăng ký.
 */
@RestController
@RequestMapping(ApiConstants.API_ADMIN_WORK_SHIFTS)
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
@Tag(name = "Admin - Ca làm việc", description = "API quản trị: tạo ca trống, xem đăng ký, duyệt đăng ký")
public class AdminWorkShiftController {

    private final WorkShiftService workShiftService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Tạo ca trống (Open Shift)")
    public ResponseEntity<ApiResponse<WorkShiftResponse>> createOpenShift(
            @Valid @RequestBody OpenShiftRequest request) {
        WorkShiftResponse response = workShiftService.createOpenShift(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo ca trống thành công", response));
    }

    @PostMapping("/batch")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Tạo nhiều ca trống cùng lúc (tuần chuẩn). Ca đã có sẵn sẽ bỏ qua, chỉ tạo ca còn thiếu.")
    public ResponseEntity<ApiResponse<List<WorkShiftResponse>>> createOpenShiftsBatch(
            @Valid @RequestBody BatchOpenShiftRequest request) {
        List<WorkShiftResponse> responses = workShiftService.createOpenShiftsBatch(request.shifts());
        String message = "Đã tạo đủ ca làm";
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(message, responses));
    }

    @PutMapping("/{shiftId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Cập nhật ca trống (chỉ ca status OPEN)")
    public ResponseEntity<ApiResponse<WorkShiftResponse>> updateOpenShift(
            @PathVariable Long shiftId,
            @Valid @RequestBody OpenShiftRequest request) {
        WorkShiftResponse response = workShiftService.updateOpenShift(shiftId, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật ca trống thành công", response));
    }

    @DeleteMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Xóa tất cả ca làm của TUẦN TIẾP THEO (và đăng ký, định mức role) – để tạo lại từ đầu")
    public ResponseEntity<ApiResponse<Void>> deleteAllWorkShifts() {
        workShiftService.deleteAllWorkShifts();
        return ResponseEntity.ok(ApiResponse.success("Đã xóa tất cả ca làm của tuần tiếp theo. Bạn có thể tạo lại ca mới."));
    }

    @DeleteMapping("/{shiftId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Hủy/Xóa ca trống (chỉ ca status OPEN)")
    public ResponseEntity<ApiResponse<Void>> cancelOpenShift(@PathVariable Long shiftId) {
        workShiftService.cancelOpenShift(shiftId);
        return ResponseEntity.ok(ApiResponse.success("Đã hủy ca trống"));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Lấy danh sách ca trong khoảng (OPEN + ASSIGNED) để hiển thị grid, kể cả ca đã khóa")
    public ResponseEntity<ApiResponse<List<WorkShiftResponse>>> getShiftsByDateRange(
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to) {
        List<WorkShiftResponse> responses = workShiftService.getShiftsForAdminByDateRange(from, to);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/booking-pet-services")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Danh sách booking_pet_service đủ điều kiện xếp ca + danh sách chờ theo tuần đang xem")
    public ResponseEntity<ApiResponse<WorkShiftBookingPetServicePoolResponse>> getAssignableBookingPetServices(
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to) {
        WorkShiftBookingPetServicePoolResponse response = workShiftService.getAssignableBookingPetServices(from, to);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/booking-pet-services/{bookingPetServiceId}/assign-options")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Xem trước: SL NV yêu cầu + danh sách NV trong ca đích (không ghi DB)")
    public ResponseEntity<ApiResponse<WorkShiftAssignOptionsResponse>> getAssignOptionsForBookingPetService(
            @PathVariable Long bookingPetServiceId) {
        WorkShiftAssignOptionsResponse response =
                workShiftService.getAssignOptionsForBookingPetService(bookingPetServiceId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/booking-pet-services/{bookingPetServiceId}/assign-auto")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Tự tìm ca đã khóa (ASSIGNED) khớp lịch rồi gán booking_pet_service + nhân viên đã chọn")
    public ResponseEntity<ApiResponse<Void>> assignBookingPetServiceToShiftAuto(
            @PathVariable Long bookingPetServiceId,
            @Valid @RequestBody AssignBookingPetServiceStaffRequest body) {
        workShiftService.assignBookingPetServiceToShiftAuto(bookingPetServiceId, body.staffIds());
        return ResponseEntity.ok(ApiResponse.success("Đã thêm booking_pet_service vào ca phù hợp."));
    }

    @GetMapping("/{shiftId}/role-configs")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Lấy định mức theo vai trò của ca (số slot tối đa mỗi chức vụ)")
    public ResponseEntity<ApiResponse<List<ShiftRoleConfigResponse>>> getRoleConfigs(@PathVariable Long shiftId) {
        List<ShiftRoleConfigResponse> responses = workShiftService.getRoleConfigsForShift(shiftId);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @PutMapping("/{shiftId}/role-configs")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Thiết lập định mức theo vai trò cho ca (vd: Thu ngân 1, Spa 2). Chỉ áp dụng cho ca OPEN.")
    public ResponseEntity<ApiResponse<List<ShiftRoleConfigResponse>>> setRoleConfigs(
            @PathVariable Long shiftId,
            @Valid @RequestBody List<ShiftRoleConfigItemRequest> configs) {
        List<ShiftRoleConfigResponse> responses = workShiftService.setRoleConfigsForShift(shiftId, configs);
        return ResponseEntity.ok(ApiResponse.success("Đã cập nhật định mức theo vai trò", responses));
    }

    @GetMapping("/{shiftId}/registrations")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Lấy danh sách đăng ký theo ca")
    public ResponseEntity<ApiResponse<List<WorkShiftRegistrationResponse>>> getRegistrations(
            @PathVariable Long shiftId) {
        List<WorkShiftRegistrationResponse> responses = workShiftService.getRegistrationsForShift(shiftId);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/{shiftId}/assigned-booking-pet-services")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Danh sách booking_pet_service đã xếp lịch (overlap thời gian với ca)")
    public ResponseEntity<ApiResponse<List<WorkShiftAssignedBookingPetServiceResponse>>> getAssignedBookingPetServices(
            @PathVariable Long shiftId) {
        List<WorkShiftAssignedBookingPetServiceResponse> responses =
                workShiftService.getBookingPetServicesAssignedToShift(shiftId);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @PostMapping("/{shiftId}/registrations/{registrationId}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Duyệt đăng ký - gán nhân viên cho ca")
    public ResponseEntity<ApiResponse<WorkShiftResponse>> approveRegistration(
            @PathVariable Long shiftId,
            @PathVariable Long registrationId) {
        WorkShiftResponse response = workShiftService.approveRegistration(shiftId, registrationId);
        return ResponseEntity.ok(ApiResponse.success("Duyệt đăng ký thành công", response));
    }

    @PutMapping("/{shiftId}/registrations/{registrationId}/on-leave")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Duyệt xin nghỉ – chuyển Xin nghỉ chờ duyệt sang Đã nghỉ (nhả slot cho Part-time đăng ký bù)")
    public ResponseEntity<ApiResponse<WorkShiftRegistrationResponse>> setRegistrationOnLeave(
            @PathVariable Long shiftId,
            @PathVariable Long registrationId) {
        WorkShiftRegistrationResponse response = workShiftService.setRegistrationOnLeave(shiftId, registrationId);
        return ResponseEntity.ok(ApiResponse.success("Đã duyệt xin nghỉ. Slot đã được nhả cho đăng ký bù.", response));
    }

    @PutMapping("/{shiftId}/registrations/{registrationId}/reject-leave")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Từ chối xin nghỉ – chuyển Xin nghỉ chờ duyệt về Đã xếp ca (nhân viên vẫn làm ca)")
    public ResponseEntity<ApiResponse<WorkShiftRegistrationResponse>> rejectLeaveRequest(
            @PathVariable Long shiftId,
            @PathVariable Long registrationId) {
        WorkShiftRegistrationResponse response = workShiftService.rejectLeaveRequest(shiftId, registrationId);
        return ResponseEntity.ok(ApiResponse.success("Đã từ chối xin nghỉ. Nhân viên vẫn làm ca.", response));
    }

    @PostMapping("/{shiftId}/auto-fill")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Điền ca theo lịch cố định – tạo định mức mặc định (nếu chưa có) và gán Full-time trùng lịch (trạng thái Chờ duyệt).")
    public ResponseEntity<ApiResponse<Void>> runAutoFillForShift(@PathVariable Long shiftId) {
        workShiftService.runAutoFillForShift(shiftId);
        return ResponseEntity.ok(ApiResponse.success("Đã điền ca theo lịch cố định. Nhân viên Full-time ở trạng thái Đã duyệt."));
    }

    @PostMapping("/{shiftId}/finalize-approvals")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Duyệt lần cuối – chuyển tất cả đăng ký Chờ duyệt của ca sang Đã duyệt; Ca của tôi sẽ hiển thị đúng sau bước này.")
    public ResponseEntity<ApiResponse<Void>> finalizeShiftApprovals(@PathVariable Long shiftId) {
        workShiftService.finalizeShiftApprovals(shiftId);
        return ResponseEntity.ok(ApiResponse.success("Đã duyệt ca lần cuối."));
    }

    @DeleteMapping("/{shiftId}/registrations/{registrationId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Hủy xếp ca – Admin xóa đăng ký (PENDING/APPROVED) để nhả slot cho ca này.")
    public ResponseEntity<ApiResponse<Void>> cancelRegistration(
            @PathVariable Long shiftId,
            @PathVariable Long registrationId) {
        workShiftService.cancelAdminRegistration(shiftId, registrationId);
        return ResponseEntity.ok(ApiResponse.success("Đã hủy xếp ca."));
    }

    @PutMapping("/{shiftId}/booking-pet-services/{bookingPetServiceId}/assign")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Gán booking_pet_service vào ca cụ thể + nhân viên đã chọn")
    public ResponseEntity<ApiResponse<Void>> assignBookingPetServiceToShift(
            @PathVariable Long shiftId,
            @PathVariable Long bookingPetServiceId,
            @Valid @RequestBody AssignBookingPetServiceStaffRequest body) {
        workShiftService.assignBookingPetServiceToShift(shiftId, bookingPetServiceId, body.staffIds());
        return ResponseEntity.ok(ApiResponse.success("Đã thêm booking_pet_service vào ca."));
    }

    @PutMapping("/booking-pet-services/{bookingPetServiceId}/unassign")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Bỏ booking_pet_service khỏi ca (clear scheduledStartTime/scheduledEndTime)")
    public ResponseEntity<ApiResponse<Void>> unassignBookingPetService(
            @PathVariable Long bookingPetServiceId) {
        workShiftService.unassignBookingPetService(bookingPetServiceId);
        return ResponseEntity.ok(ApiResponse.success("Đã đưa booking_pet_service về danh sách."));
    }

    @GetMapping("/{shiftId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Lấy chi tiết ca làm việc theo id")
    public ResponseEntity<ApiResponse<WorkShiftResponse>> getById(@PathVariable Long shiftId) {
        WorkShiftResponse response = workShiftService.getById(shiftId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
