package fpt.teddypet.presentation.controller.staff;

import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.request.staff.TaskHistoryRequest;
import fpt.teddypet.application.dto.response.staff.TaskHistoryResponse;
import fpt.teddypet.application.port.input.staff.TaskHistoryService;
import fpt.teddypet.presentation.constants.ApiConstants;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping(ApiConstants.BASE_API + "/staff/tasks")
@RequiredArgsConstructor
@Tag(name = "Lịch sử công việc", description = "API lưu lịch sử công việc và hoa hồng của nhân viên")
public class TaskHistoryController {

    private final TaskHistoryService taskHistoryService;

    @PostMapping
    @Operation(summary = "Tạo bản ghi công việc", description = "Được hệ thống Booking gọi khi nhân viên hoàn thành một dịch vụ")
    public ResponseEntity<ApiResponse<TaskHistoryResponse>> create(
            @Valid @RequestBody TaskHistoryRequest request) {
        TaskHistoryResponse response = taskHistoryService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Ghi nhận công việc và hoa hồng thành công", response));
    }

    @GetMapping("/staff/{staffId}")
    @Operation(summary = "Xem lịch sử công việc theo khoảng ngày", description = "Lấy danh sách công việc của một nhân viên trong khoảng ngày")
    public ResponseEntity<ApiResponse<List<TaskHistoryResponse>>> getByStaffAndDateRange(
            @PathVariable Long staffId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        List<TaskHistoryResponse> responses = taskHistoryService.getByStaffAndDateRange(staffId, from, to);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }
}

