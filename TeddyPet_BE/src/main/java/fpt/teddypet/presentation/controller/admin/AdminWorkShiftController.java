package fpt.teddypet.presentation.controller.admin;

import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.request.staff.BatchOpenShiftRequest;
import fpt.teddypet.application.dto.request.staff.OpenShiftRequest;
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

import java.util.List;

/**
 * Admin API: Tạo ca trống, xem đăng ký, duyệt đăng ký.
 */
@RestController
@RequestMapping(ApiConstants.API_ADMIN_WORK_SHIFTS)
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin - Ca làm việc", description = "API quản trị: tạo ca trống, xem đăng ký, duyệt đăng ký")
public class AdminWorkShiftController {

    private final WorkShiftService workShiftService;

    @PostMapping
    @Operation(summary = "Tạo ca trống (Open Shift)")
    public ResponseEntity<ApiResponse<WorkShiftResponse>> createOpenShift(
            @Valid @RequestBody OpenShiftRequest request) {
        WorkShiftResponse response = workShiftService.createOpenShift(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo ca trống thành công", response));
    }

    @PostMapping("/batch")
    @Operation(summary = "Tạo nhiều ca trống cùng lúc (tuần chuẩn). Ca đã có sẵn sẽ bỏ qua, chỉ tạo ca còn thiếu.")
    public ResponseEntity<ApiResponse<List<WorkShiftResponse>>> createOpenShiftsBatch(
            @Valid @RequestBody BatchOpenShiftRequest request) {
        List<WorkShiftResponse> responses = workShiftService.createOpenShiftsBatch(request.shifts());
        String message = "Đã tạo đủ ca làm";
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(message, responses));
    }

    @PutMapping("/{shiftId}")
    @Operation(summary = "Cập nhật ca trống (chỉ ca status OPEN)")
    public ResponseEntity<ApiResponse<WorkShiftResponse>> updateOpenShift(
            @PathVariable Long shiftId,
            @Valid @RequestBody OpenShiftRequest request) {
        WorkShiftResponse response = workShiftService.updateOpenShift(shiftId, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật ca trống thành công", response));
    }

    @DeleteMapping("/{shiftId}")
    @Operation(summary = "Hủy/Xóa ca trống (chỉ ca status OPEN)")
    public ResponseEntity<ApiResponse<Void>> cancelOpenShift(@PathVariable Long shiftId) {
        workShiftService.cancelOpenShift(shiftId);
        return ResponseEntity.ok(ApiResponse.success("Đã hủy ca trống"));
    }

    @GetMapping("/{shiftId}/registrations")
    @Operation(summary = "Lấy danh sách đăng ký theo ca")
    public ResponseEntity<ApiResponse<List<WorkShiftRegistrationResponse>>> getRegistrations(
            @PathVariable Long shiftId) {
        List<WorkShiftRegistrationResponse> responses = workShiftService.getRegistrationsForShift(shiftId);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @PostMapping("/{shiftId}/registrations/{registrationId}/approve")
    @Operation(summary = "Duyệt đăng ký - gán nhân viên cho ca")
    public ResponseEntity<ApiResponse<WorkShiftResponse>> approveRegistration(
            @PathVariable Long shiftId,
            @PathVariable Long registrationId) {
        WorkShiftResponse response = workShiftService.approveRegistration(shiftId, registrationId);
        return ResponseEntity.ok(ApiResponse.success("Duyệt đăng ký thành công", response));
    }

    @GetMapping("/{shiftId}")
    @Operation(summary = "Lấy chi tiết ca làm việc theo id")
    public ResponseEntity<ApiResponse<WorkShiftResponse>> getById(@PathVariable Long shiftId) {
        WorkShiftResponse response = workShiftService.getById(shiftId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
