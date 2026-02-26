package fpt.teddypet.presentation.controller.staff;

import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.response.staff.StaffRealtimeResponse;
import fpt.teddypet.application.port.input.staff.StaffRealtimeService;
import fpt.teddypet.domain.enums.staff.StaffRealtimeStatusEnum;
import fpt.teddypet.presentation.constants.ApiConstants;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping(ApiConstants.BASE_API + "/staff/realtime")
@RequiredArgsConstructor
@Tag(name = "Trạng thái realtime nhân viên", description = "API quản lý trạng thái realtime (ONLINE/OFFLINE/BUSY/ON_BREAK) của nhân viên")
public class StaffRealtimeController {

    private final StaffRealtimeService staffRealtimeService;

    @GetMapping("/{staffId}")
    @Operation(summary = "Lấy trạng thái realtime của nhân viên")
    public ResponseEntity<ApiResponse<StaffRealtimeResponse>> getByStaffId(@PathVariable Long staffId) {
        StaffRealtimeResponse response = staffRealtimeService.getByStaffId(staffId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{staffId}/status")
    @Operation(summary = "Cập nhật trạng thái realtime (tổng quát)")
    public ResponseEntity<ApiResponse<StaffRealtimeResponse>> updateStatus(
            @PathVariable Long staffId,
            @RequestParam StaffRealtimeStatusEnum status,
            @RequestParam(required = false) UUID bookingId) {
        StaffRealtimeResponse response = staffRealtimeService.updateStatus(staffId, status, bookingId);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái realtime thành công", response));
    }

    @PostMapping("/{staffId}/available")
    @Operation(summary = "Đánh dấu nhân viên ở trạng thái AVAILABLE (rảnh, sẵn sàng nhận booking)")
    public ResponseEntity<ApiResponse<StaffRealtimeResponse>> markAvailable(@PathVariable Long staffId) {
        StaffRealtimeResponse response = staffRealtimeService.markAvailable(staffId);
        return ResponseEntity.ok(ApiResponse.success("Nhân viên đã sẵn sàng nhận booking", response));
    }

    @PostMapping("/{staffId}/busy")
    @Operation(summary = "Đánh dấu nhân viên đang BUSY với một booking")
    public ResponseEntity<ApiResponse<StaffRealtimeResponse>> markBusy(
            @PathVariable Long staffId,
            @RequestParam UUID bookingId) {
        StaffRealtimeResponse response = staffRealtimeService.markBusy(staffId, bookingId);
        return ResponseEntity.ok(ApiResponse.success("Nhân viên đang thực hiện booking", response));
    }

    @PostMapping("/{staffId}/offline")
    @Operation(summary = "Đánh dấu nhân viên OFFLINE (ngoài ca hoặc đã về)")
    public ResponseEntity<ApiResponse<StaffRealtimeResponse>> markOffline(@PathVariable Long staffId) {
        StaffRealtimeResponse response = staffRealtimeService.markOffline(staffId);
        return ResponseEntity.ok(ApiResponse.success("Nhân viên đã offline", response));
    }

    @PostMapping("/{staffId}/on-break")
    @Operation(summary = "Đánh dấu nhân viên đang nghỉ (ON_BREAK)")
    public ResponseEntity<ApiResponse<StaffRealtimeResponse>> markOnBreak(@PathVariable Long staffId) {
        StaffRealtimeResponse response = staffRealtimeService.markOnBreak(staffId);
        return ResponseEntity.ok(ApiResponse.success("Nhân viên đang nghỉ", response));
    }
}

