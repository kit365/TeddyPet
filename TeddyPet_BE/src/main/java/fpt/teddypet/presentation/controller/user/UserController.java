package fpt.teddypet.presentation.controller.user;

import fpt.teddypet.application.constants.auth.AuthMessages;
import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.request.auth.ChangePasswordRequest;
import fpt.teddypet.application.dto.request.user.UpdateProfileRequest;
import fpt.teddypet.application.dto.response.UserProfileResponse;
import fpt.teddypet.application.dto.response.user.UserAvatarItemResponse;
import fpt.teddypet.application.port.input.AuthService;
import fpt.teddypet.application.port.input.UserService;
import fpt.teddypet.application.port.input.auth.OtpService;
import fpt.teddypet.application.service.user.UserExcelService;
import fpt.teddypet.domain.entity.User;
import fpt.teddypet.presentation.constants.ApiConstants;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping(ApiConstants.API_USER)
@Tag(name = "Tài khoản người dùng", description = "API quản lý thông tin tài khoản người dùng")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final AuthService authService;
    private final OtpService otpService;
    private final UserExcelService userExcelService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    @Operation(summary = "[Admin] Danh sách người dùng", description = "Lấy danh sách user (có thể lọc theo role, chỉ ADMIN/SUPER_ADMIN).")
    public ResponseEntity<ApiResponse<List<UserProfileResponse>>> getAllUsers(
            @RequestParam(required = false) String role) {
        List<UserProfileResponse> list = userService.getAllUsers(role);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PutMapping("/profile")
    @Operation(summary = "Cập nhật hồ sơ người dùng", description = "Cập nhật thông tin hồ sơ của người dùng đang đăng nhập (yêu cầu JWT hợp lệ).")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request) {
        User currentUser = authService.getCurrentUser();
        UserProfileResponse response = userService.updateProfile(currentUser, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thông tin thành công", response));
    }

    @GetMapping("/profile/avatars")
    @Operation(summary = "Danh sách ảnh đại diện đã dùng", description = "Lấy danh sách ảnh đại diện từng dùng (để chọn ảnh cũ).")
    public ResponseEntity<ApiResponse<List<UserAvatarItemResponse>>> getMyAvatarImages() {
        User currentUser = authService.getCurrentUser();
        List<UserAvatarItemResponse> list = userService.getMyAvatarImages(currentUser);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PostMapping("/change-password/send-otp")
    @Operation(summary = "Gửi mã OTP đổi mật khẩu cho thành viên", description = "Gửi mã OTP đến email của người dùng đang đăng nhập.")
    public ResponseEntity<ApiResponse<Long>> sendChangePasswordOtp() {
        User currentUser = authService.getCurrentUser();
        long cooldown = otpService.sendMemberOtp(currentUser.getEmail());
        return ResponseEntity.ok(ApiResponse.success("Mã xác thực đã được gửi đến email của bạn.", cooldown));
    }

    @PostMapping("/change-password/verify-otp")
    @Operation(summary = "Xác thực mã OTP đổi mật khẩu", description = "Kiểm tra mã OTP nhập vào có khớp với mã đã gửi qua email không.")
    public ResponseEntity<ApiResponse<String>> verifyChangePasswordOtp(@RequestParam String otpCode) {
        User currentUser = authService.getCurrentUser();
        otpService.validateGuestOtp(currentUser.getEmail(), otpCode);
        return ResponseEntity.ok(ApiResponse.success("Mã xác thực chính xác."));
    }

    @PostMapping("/change-password/verify-password")
    @Operation(summary = "Xác thực mật khẩu hiện tại", description = "Kiểm tra mật khẩu nhập vào có đúng với mật khẩu hiện tại của người dùng không.")
    public ResponseEntity<ApiResponse<String>> verifyOldPassword(@RequestParam String password) {
        authService.verifyCurrentPassword(password);
        return ResponseEntity.ok(ApiResponse.success("Mật khẩu chính xác."));
    }

    @PutMapping("/change-password")
    @Operation(summary = "Đổi mật khẩu thành viên", description = "Xác thực mật khẩu cũ và mã OTP để đổi mật khẩu mới.")
    public ResponseEntity<ApiResponse<Void>> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(request);
        return ResponseEntity.ok(ApiResponse.success(AuthMessages.MESSAGE_CHANGE_PASSWORD_SUCCESS));
    }

    // ─── Excel (Admin: danh sách khách hàng) ───────────────────────────────────

    @GetMapping("/excel/export")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    @Operation(summary = "[Admin] Xuất danh sách người dùng ra Excel")
    public void exportExcel(HttpServletResponse response) {
        userExcelService.exportUsers(response);
    }

    @GetMapping("/excel/template")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    @Operation(summary = "[Admin] Tải template Excel nhập người dùng")
    public void downloadTemplate(HttpServletResponse response) {
        userExcelService.downloadTemplate(response);
    }

    @PostMapping("/excel/preview")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    @Operation(summary = "[Admin] Xem trước file Excel nhập người dùng")
    public ResponseEntity<ApiResponse<List<UserExcelService.UserPreviewRow>>> previewImport(
            @RequestParam("file") MultipartFile file) {
        List<UserExcelService.UserPreviewRow> result = userExcelService.previewImport(file);
        return ResponseEntity.ok(ApiResponse.success("Preview người dùng", result));
    }

    @PostMapping("/excel/import")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    @Operation(summary = "[Admin] Nhập người dùng từ file Excel")
    public ResponseEntity<ApiResponse<UserExcelService.ImportResult>> importExcel(
            @RequestParam("file") MultipartFile file) {
        UserExcelService.ImportResult result = userExcelService.importUsers(file);
        return ResponseEntity.ok(ApiResponse.success("Import người dùng hoàn tất.", result));
    }
}
