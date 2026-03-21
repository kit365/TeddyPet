package fpt.teddypet.presentation.controller.staff;

import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.response.staff.EmployeeTaskResponse;
import fpt.teddypet.application.service.staff.StaffTaskApplicationService;
import fpt.teddypet.presentation.constants.ApiConstants;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping(ApiConstants.BASE_API + "/staff/tasks")
@RequiredArgsConstructor
@Tag(name = "Công việc nhân viên", description = "API quản lý task (công việc in-progress) của nhân viên cho hôm nay")
public class StaffTaskController {

    private final StaffTaskApplicationService staffTaskApplicationService;

    @GetMapping("/today")
    @Operation(summary = "Lấy danh sách công việc cần làm hôm nay")
    public ResponseEntity<ApiResponse<List<EmployeeTaskResponse>>> getTodayTasks() {
        List<EmployeeTaskResponse> response = staffTaskApplicationService.getTodayTasks();
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách thành công", response));
    }
}
