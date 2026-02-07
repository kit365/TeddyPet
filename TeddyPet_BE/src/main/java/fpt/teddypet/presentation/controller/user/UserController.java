package fpt.teddypet.presentation.controller.user;

import fpt.teddypet.application.constants.auth.AuthMessages;
import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.request.auth.ChangePasswordRequest;
import fpt.teddypet.application.dto.request.user.UpdateProfileRequest;
import fpt.teddypet.application.dto.response.UserProfileResponse;
import fpt.teddypet.application.port.input.AuthService;
import fpt.teddypet.application.port.input.UserService;
import fpt.teddypet.application.port.input.auth.OtpService;
import fpt.teddypet.domain.entity.User;
import fpt.teddypet.presentation.constants.ApiConstants;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(ApiConstants.API_USER)
@Tag(name = "User", description = "User Management APIs")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final AuthService authService;
    private final OtpService otpService;

    @PutMapping("/profile")
    @Operation(summary = "Update user profile", description = "Update the authenticated user's profile information. Requires a valid JWT token.")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request) {
        User currentUser = authService.getCurrentUser();
        UserProfileResponse response = userService.updateProfile(currentUser, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thông tin thành công", response));
    }

    @PostMapping("/change-password/send-otp")
    @Operation(summary = "Gửi mã OTP đổi mật khẩu cho thành viên", description = "Gửi mã OTP đến email của người dùng đang đăng nhập.")
    public ResponseEntity<ApiResponse<Long>> sendChangePasswordOtp() {
        User currentUser = authService.getCurrentUser();
        long cooldown = otpService.sendMemberOtp(currentUser.getEmail());
        return ResponseEntity.ok(ApiResponse.success("Mã xác thực đã được gửi đến email của bạn.", cooldown));
    }

    @PutMapping("/change-password")
    @Operation(summary = "Đổi mật khẩu thành viên", description = "Xác thực mật khẩu cũ và mã OTP để đổi mật khẩu mới.")
    public ResponseEntity<ApiResponse<Void>> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(request);
        return ResponseEntity.ok(ApiResponse.success(AuthMessages.MESSAGE_CHANGE_PASSWORD_SUCCESS));
    }
}
