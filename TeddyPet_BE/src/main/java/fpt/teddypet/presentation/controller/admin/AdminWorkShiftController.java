package fpt.teddypet.presentation.controller.admin;

import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.request.staff.BatchOpenShiftRequest;
import fpt.teddypet.application.dto.request.staff.OpenShiftRequest;
import fpt.teddypet.application.dto.request.staff.ShiftRoleConfigItemRequest;
import fpt.teddypet.application.dto.response.staff.ShiftRoleConfigResponse;
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
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
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
    @Operation(summary = "Xóa tất cả ca làm (và đăng ký, định mức role) – để tạo lại từ đầu")
    public ResponseEntity<ApiResponse<Void>> deleteAllWorkShifts() {
        workShiftService.deleteAllWorkShifts();
        return ResponseEntity.ok(ApiResponse.success("Đã xóa tất cả ca làm. Bạn có thể tạo lại ca mới."));
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
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        List<WorkShiftResponse> responses = workShiftService.getShiftsForAdminByDateRange(from, to);
        return ResponseEntity.ok(ApiResponse.success(responses));
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
        return ResponseEntity.ok(ApiResponse.success("Đã điền ca theo lịch cố định. Nhân viên Full-time ở trạng thái Chờ duyệt."));
    }

    @PostMapping("/{shiftId}/finalize-approvals")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Duyệt lần cuối – chuyển tất cả đăng ký Chờ duyệt của ca sang Đã duyệt; Ca của tôi sẽ hiển thị đúng sau bước này.")
    public ResponseEntity<ApiResponse<Void>> finalizeShiftApprovals(@PathVariable Long shiftId) {
        workShiftService.finalizeShiftApprovals(shiftId);
        return ResponseEntity.ok(ApiResponse.success("Đã duyệt ca lần cuối."));
    }

    @GetMapping("/{shiftId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Lấy chi tiết ca làm việc theo id")
    public ResponseEntity<ApiResponse<WorkShiftResponse>> getById(@PathVariable Long shiftId) {
        WorkShiftResponse response = workShiftService.getById(shiftId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
