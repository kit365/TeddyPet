package fpt.teddypet.presentation.controller.staff;

import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.request.staff.StaffTaskServicePhotosRequest;
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
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping(ApiConstants.BASE_API + "/staff/tasks")
@RequiredArgsConstructor
@Tag(name = "Công việc nhân viên", description = "API danh sách booking_pet_service đã gán cho nhân viên (theo khoảng lịch gần đây / tới)")
public class StaffTaskController {

    private final StaffTaskApplicationService staffTaskApplicationService;
    private final AuthService authService;
    private final StaffProfileRepositoryPort staffProfileRepositoryPort;

    @GetMapping("/today")
    @Operation(summary = "Lấy danh sách công việc (booking_pet_service đã gán NV, theo lịch trong khoảng ~7 ngày qua → 30 ngày tới)")
    public ResponseEntity<ApiResponse<List<EmployeeTaskResponse>>> getTodayTasks() {
        Long staffId = getCurrentStaffId();
        List<EmployeeTaskResponse> response = staffTaskApplicationService.getTodayTasks(staffId);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách thành công", response));
    }

    @PostMapping("/{bookingPetServiceId}/start")
    @Operation(summary = "Bắt đầu xử lý dịch vụ: gán NV vào booking_pet_service, set actualStartTime, IN_PROGRESS")
    public ResponseEntity<ApiResponse<EmployeeTaskResponse>> startTask(@PathVariable Long bookingPetServiceId) {
        Long staffId = getCurrentStaffId();
        EmployeeTaskResponse response = staffTaskApplicationService.startTask(bookingPetServiceId, staffId);
        return ResponseEntity.ok(ApiResponse.success("Đã bắt đầu xử lý dịch vụ.", response));
    }

    @PostMapping("/{bookingPetServiceId}/complete")
    @Operation(summary = "Hoàn thành dịch vụ (không phải dịch vụ phòng): set actualEndTime, COMPLETED")
    public ResponseEntity<ApiResponse<EmployeeTaskResponse>> completeTask(@PathVariable Long bookingPetServiceId) {
        Long staffId = getCurrentStaffId();
        EmployeeTaskResponse response = staffTaskApplicationService.completeTask(bookingPetServiceId, staffId);
        return ResponseEntity.ok(ApiResponse.success("Đã hoàn thành dịch vụ.", response));
    }

    @PostMapping("/{bookingPetServiceId}/service-photos")
    @Operation(summary = "Cập nhật ảnh trước/trong/sau cho dịch vụ Spa/Grooming")
    public ResponseEntity<ApiResponse<EmployeeTaskResponse>> updateServicePhotos(
            @PathVariable Long bookingPetServiceId,
            @RequestBody StaffTaskServicePhotosRequest request
    ) {
        Long staffId = getCurrentStaffId();
        EmployeeTaskResponse response = staffTaskApplicationService.updateServicePhotos(bookingPetServiceId, staffId, request);
        return ResponseEntity.ok(ApiResponse.success("Đã cập nhật ảnh dịch vụ.", response));
    }

    @PostMapping("/{bookingPetServiceId}/pet-in-hotel")
    @Operation(summary = "Xác nhận đã set up xong và đưa thú cưng vào hotel (dịch vụ phòng)")
    public ResponseEntity<ApiResponse<EmployeeTaskResponse>> markPetInHotel(@PathVariable Long bookingPetServiceId) {
        Long staffId = getCurrentStaffId();
        EmployeeTaskResponse response = staffTaskApplicationService.markPetInHotel(bookingPetServiceId, staffId);
        return ResponseEntity.ok(ApiResponse.success("Đã cập nhật trạng thái thú cưng vào hotel.", response));
    }

    private Long getCurrentStaffId() {
        User user = authService.getCurrentUser();
        StaffProfile staff = staffProfileRepositoryPort.findByUserId(user.getId())
                .orElseThrow(() -> new IllegalStateException(
                        "Người dùng hiện tại chưa có hồ sơ nhân viên. Vui lòng liên hệ admin."));
        return staff.getId();
    }
}
