package fpt.teddypet.presentation.controller.staff;

import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.response.staff.WorkShiftRegistrationResponse;
import fpt.teddypet.application.dto.response.staff.WorkShiftResponse;
import fpt.teddypet.application.port.input.AuthService;
import fpt.teddypet.application.port.input.staff.WorkShiftService;
import fpt.teddypet.application.port.output.staff.StaffProfileRepositoryPort;
import fpt.teddypet.domain.entity.User;
import fpt.teddypet.domain.entity.staff.StaffProfile;
import fpt.teddypet.presentation.constants.ApiConstants;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Staff API: Xem ca trống, đăng ký ca, xem ca của mình.
 */
@RestController
@RequestMapping(ApiConstants.BASE_API + "/staff/work-shifts")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
@Tag(name = "Staff - Ca làm việc", description = "API nhân viên: xem ca trống, đăng ký ca")
public class WorkShiftController {

    private final WorkShiftService workShiftService;
    private final AuthService authService;
    private final StaffProfileRepositoryPort staffProfileRepositoryPort;

    @GetMapping("/available")
    @Operation(summary = "Lấy danh sách ca trống có thể đăng ký")
    public ResponseEntity<ApiResponse<List<WorkShiftResponse>>> getAvailableShifts(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        List<WorkShiftResponse> responses = workShiftService.getAvailableShifts(from, to);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @PostMapping("/{shiftId}/register")
    @Operation(summary = "Đăng ký ca làm việc (dùng staffId từ JWT)")
    public ResponseEntity<ApiResponse<WorkShiftRegistrationResponse>> registerForShift(
            @PathVariable @NotNull Long shiftId) {
        Long staffId = getCurrentStaffId();
        WorkShiftRegistrationResponse response = workShiftService.registerForShift(shiftId, staffId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đăng ký ca thành công", response));
    }

    @GetMapping("/staff/{staffId}")
    @Operation(summary = "Lấy danh sách ca của nhân viên theo khoảng thời gian")
    public ResponseEntity<ApiResponse<List<WorkShiftResponse>>> getByStaffAndDateRange(
            @PathVariable Long staffId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        List<WorkShiftResponse> responses = workShiftService.getByStaffAndDateRange(staffId, from, to);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/my-shifts")
    @Operation(summary = "Lấy danh sách ca của nhân viên đang đăng nhập")
    public ResponseEntity<ApiResponse<List<WorkShiftResponse>>> getMyShifts(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        Long staffId = getCurrentStaffId();
        List<WorkShiftResponse> responses = workShiftService.getByStaffAndDateRange(staffId, from, to);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/{shiftId}")
    @Operation(summary = "Lấy chi tiết ca làm việc theo id")
    public ResponseEntity<ApiResponse<WorkShiftResponse>> getById(@PathVariable Long shiftId) {
        WorkShiftResponse response = workShiftService.getById(shiftId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    private Long getCurrentStaffId() {
        User user = authService.getCurrentUser();
        StaffProfile staff = staffProfileRepositoryPort.findByUserId(user.getId())
                .orElseThrow(() -> new IllegalStateException(
                        "Người dùng hiện tại chưa có hồ sơ nhân viên. Vui lòng liên hệ admin."));
        return staff.getId();
    }
}
