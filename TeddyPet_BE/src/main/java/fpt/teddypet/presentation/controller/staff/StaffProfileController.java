package fpt.teddypet.presentation.controller.staff;

import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.request.staff.AccountCreationDTO;
import fpt.teddypet.application.dto.request.staff.StaffCreationDTO;
import fpt.teddypet.application.dto.request.staff.StaffProfileRequest;
import fpt.teddypet.application.dto.response.staff.StaffProfileResponse;
import fpt.teddypet.application.port.input.staff.StaffProfileService;
import fpt.teddypet.application.port.input.AuthService;
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

@RestController
@RequestMapping(ApiConstants.BASE_API + "/staff/profiles")
@RequiredArgsConstructor
@Tag(name = "Hồ sơ nhân viên", description = "API quản lý hồ sơ nhân viên")
public class StaffProfileController {

    private final StaffProfileService staffProfileService;
    private final AuthService authService;

    @PostMapping
    @Operation(summary = "Flow A: Tạo hồ sơ nhân viên + Tự động cấp tài khoản (nếu có email)", description = "Nếu có email và role, hệ thống sẽ tự động tạo User/Whitelist. Nếu không, chỉ tạo hồ sơ.")
    public ResponseEntity<ApiResponse<StaffProfileResponse>> createProfile(
            @Valid @RequestBody StaffCreationDTO request) {
        StaffProfileResponse response = staffProfileService.createProfile(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo hồ sơ nhân viên thành công", response));
    }

    @PostMapping("/{staffId}/account")
    @Operation(summary = "Flow B: Cấp tài khoản cho nhân viên đã có hồ sơ", description = "Smart linking: tạo User mới nếu chưa tồn tại; link User đã có (khách hàng trở thành nhân viên) nếu email khớp. Email lấy từ profile.")
    public ResponseEntity<ApiResponse<StaffProfileResponse>> provisionAccount(
            @PathVariable Long staffId,
            @Valid @RequestBody AccountCreationDTO request) {
        StaffProfileResponse response = staffProfileService.provisionAccount(staffId, request);
        return ResponseEntity.ok(ApiResponse.success("Cấp tài khoản thành công", response));
    }

    @PutMapping("/{staffId}")
    @Operation(summary = "Cập nhật hồ sơ nhân viên")
    public ResponseEntity<ApiResponse<StaffProfileResponse>> update(
            @PathVariable Long staffId,
            @Valid @RequestBody StaffProfileRequest request) {
        StaffProfileResponse response = staffProfileService.update(staffId, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật hồ sơ nhân viên thành công", response));
    }

    @DeleteMapping("/{staffId}")
    @Operation(summary = "Ngừng hoạt động (deactivate) một nhân viên")
    public ResponseEntity<ApiResponse<Void>> deactivate(@PathVariable Long staffId) {
        staffProfileService.deactivate(staffId);
        return ResponseEntity.ok(ApiResponse.success("Ngừng hoạt động nhân viên thành công"));
    }

    @PutMapping("/{staffId}/reactivate")
    @Operation(summary = "Kích hoạt lại nhân viên đã bị ngừng hoạt động")
    public ResponseEntity<ApiResponse<StaffProfileResponse>> reactivate(@PathVariable Long staffId) {
        StaffProfileResponse response = staffProfileService.reactivate(staffId);
        return ResponseEntity.ok(ApiResponse.success("Kích hoạt lại nhân viên thành công", response));
    }

    @GetMapping("/{staffId}")
    @Operation(summary = "Lấy hồ sơ nhân viên theo id")
    public ResponseEntity<ApiResponse<StaffProfileResponse>> getById(@PathVariable Long staffId) {
        StaffProfileResponse response = staffProfileService.getById(staffId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách tất cả nhân viên đang hoạt động")
    public ResponseEntity<ApiResponse<List<StaffProfileResponse>>> getAllActive() {
        List<StaffProfileResponse> responses = staffProfileService.getAllActive();
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    @Operation(summary = "Lấy hồ sơ nhân viên của user đang đăng nhập (work_type, positionId cho Đăng ký ca)")
    public ResponseEntity<ApiResponse<StaffProfileResponse>> getMyProfile() {
        StaffProfileResponse response = staffProfileService.getByUserId(authService.getCurrentUser().getId());
        if (response == null) {
            return ResponseEntity.status(HttpStatus.OK).body(ApiResponse.success("Chưa có hồ sơ nhân viên", null));
        }
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
