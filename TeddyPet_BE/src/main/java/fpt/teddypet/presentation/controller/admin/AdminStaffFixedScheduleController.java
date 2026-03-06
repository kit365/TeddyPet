package fpt.teddypet.presentation.controller.admin;

import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.request.staff.StaffFixedScheduleRequest;
import fpt.teddypet.application.dto.response.staff.StaffFixedScheduleResponse;
import fpt.teddypet.application.port.input.staff.StaffFixedScheduleService;
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
 * Admin API: Gán lịch cố định cho nhân viên Full-time (dùng cho auto-fill khi tạo ca).
 */
@RestController
@RequestMapping(ApiConstants.API_ADMIN_STAFF_FIXED_SCHEDULES)
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin - Lịch cố định Full-time", description = "Gán lịch cố định (thứ + sáng/chiều + vai trò) cho nhân viên Full-time")
public class AdminStaffFixedScheduleController {

    private final StaffFixedScheduleService staffFixedScheduleService;

    @PostMapping
    @Operation(summary = "Thêm một slot lịch cố định cho nhân viên")
    public ResponseEntity<ApiResponse<StaffFixedScheduleResponse>> create(@Valid @RequestBody StaffFixedScheduleRequest request) {
        StaffFixedScheduleResponse response = staffFixedScheduleService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đã thêm lịch cố định", response));
    }

    @GetMapping
    @Operation(summary = "Lấy lịch cố định theo nhân viên (staffId query param)")
    public ResponseEntity<ApiResponse<List<StaffFixedScheduleResponse>>> getByStaffId(@RequestParam Long staffId) {
        List<StaffFixedScheduleResponse> responses = staffFixedScheduleService.getByStaffId(staffId);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @DeleteMapping("/{scheduleId}")
    @Operation(summary = "Xóa một slot lịch cố định (khi nhập sai hoặc cần chỉnh)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long scheduleId) {
        staffFixedScheduleService.delete(scheduleId);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa lịch cố định", null));
    }
}
