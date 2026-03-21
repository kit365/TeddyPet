package fpt.teddypet.presentation.controller.staff;

import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.response.staff.EmployeeTaskResponse;
import fpt.teddypet.application.port.input.AuthService;
import fpt.teddypet.application.port.output.staff.StaffProfileRepositoryPort;
import fpt.teddypet.application.service.staff.StaffTaskApplicationService;
import fpt.teddypet.domain.entity.User;
import fpt.teddypet.domain.entity.staff.StaffProfile;
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
    private final AuthService authService;
    private final StaffProfileRepositoryPort staffProfileRepositoryPort;

    @GetMapping("/today")
    @Operation(summary = "Lấy danh sách công việc cần làm hôm nay")
    public ResponseEntity<ApiResponse<List<EmployeeTaskResponse>>> getTodayTasks() {
        Long staffId = getCurrentStaffId();
        List<EmployeeTaskResponse> response = staffTaskApplicationService.getTodayTasks(staffId);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách thành công", response));
    }

    private Long getCurrentStaffId() {
        User user = authService.getCurrentUser();
        StaffProfile staff = staffProfileRepositoryPort.findByUserId(user.getId())
                .orElseThrow(() -> new IllegalStateException(
                        "Người dùng hiện tại chưa có hồ sơ nhân viên. Vui lòng liên hệ admin."));
        return staff.getId();
    }
}
