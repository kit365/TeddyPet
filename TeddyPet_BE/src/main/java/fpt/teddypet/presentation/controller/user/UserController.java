package fpt.teddypet.presentation.controller.user;

import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.request.user.UpdateProfileRequest;
import fpt.teddypet.application.dto.response.UserProfileResponse;
import fpt.teddypet.application.port.input.AuthService;
import fpt.teddypet.application.port.input.UserService;
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

    @PutMapping("/profile")
    @Operation(summary = "Update user profile", description = "Update the authenticated user's profile information. Requires a valid JWT token.")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request) {
        User currentUser = authService.getCurrentUser();
        UserProfileResponse response = userService.updateProfile(currentUser, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thông tin thành công", response));
    }
}
