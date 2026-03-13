package fpt.teddypet.presentation.controller;

import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.port.output.AdminGoogleWhitelistPort;
import fpt.teddypet.domain.entity.AdminGoogleWhitelist;
import fpt.teddypet.domain.entity.User;
import fpt.teddypet.domain.enums.RoleEnum;
import fpt.teddypet.application.port.input.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auth/google/whitelist")
@Tag(name = "Google Login Whitelist", description = "Quản lý danh sách email được phép đăng nhập Google vào trang Admin")
@RequiredArgsConstructor
public class GoogleAuthWhitelistController {

    private final AdminGoogleWhitelistPort whitelistPort;
    private final AuthService authService;
    private final fpt.teddypet.application.port.output.EmailServicePort emailServicePort;

    @org.springframework.beans.factory.annotation.Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Lấy danh sách whitelist", description = "Chỉ Admin/SuperAdmin mới có quyền truy cập.")
    public ResponseEntity<ApiResponse<List<AdminGoogleWhitelist>>> getWhitelist() {
        return ResponseEntity.ok(ApiResponse.success("Success", whitelistPort.findAll()));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Thêm email và gửi lời mời", description = "Chỉ Admin/SuperAdmin mới có quyền truy cập. Sẽ gửi email mời kèm token xác nhận (hết hạn sau 24h).")
    public ResponseEntity<ApiResponse<AdminGoogleWhitelist>> addToWhitelist(@RequestBody WhitelistRequest request) {
        User currentUser = authService.getCurrentUser();
        String targetRole = request.role().toUpperCase();

        // Kiểm tra quyền: Chỉ SUPER_ADMIN mới được add ADMIN
        if (RoleEnum.ADMIN.name().equals(targetRole) && !RoleEnum.SUPER_ADMIN.name().equals(currentUser.getRole().getName())) {
            throw new IllegalArgumentException("Chỉ Super Admin mới được phép cấp quyền Admin.");
        }
        
        // Ngăn chặn cấp quyền SUPER_ADMIN qua API này (phải qua DB hoặc logic đặc biệt)
        if (RoleEnum.SUPER_ADMIN.name().equals(targetRole)) {
            throw new IllegalArgumentException("Không thể cấp quyền Super Admin qua tính năng này.");
        }

        String token = java.util.UUID.randomUUID().toString();
        java.time.LocalDateTime expiry = java.time.LocalDateTime.now().plusDays(1);

        AdminGoogleWhitelist newItem = AdminGoogleWhitelist.builder()
                .email(request.email().toLowerCase().trim())
                .role(request.role())
                .addedBy(currentUser.getEmail())
                .invitationToken(token)
                .tokenExpiredAt(expiry)
                .status("PENDING")
                .isActive(true)
                .isDeleted(false)
                .build();
        
        AdminGoogleWhitelist saved = whitelistPort.save(newItem);

        // Gửi email mời
        String invitationLink = frontendUrl + "/admin/auth/accept-invitation?token=" + token;
        emailServicePort.sendAdminInvitationEmail(saved.getEmail(), invitationLink);

        return ResponseEntity.ok(ApiResponse.success("Đã gửi lời mời tới " + saved.getEmail(), saved));
    }

    @PostMapping("/verify-invitation")
    @Operation(summary = "Xác nhận lời mời", description = "Dành cho người dùng nhận được email mời. Token sẽ hợp lệ trong 1 ngày.")
    public ResponseEntity<ApiResponse<AdminGoogleWhitelist>> verifyInvitation(@RequestParam String token) {
        AdminGoogleWhitelist whitelist = whitelistPort.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Mã mời không tồn tại hoặc đã bị hủy."));

        if (whitelist.getTokenExpiredAt().isBefore(java.time.LocalDateTime.now())) {
            whitelist.setStatus("EXPIRED");
            whitelistPort.save(whitelist);
            throw new IllegalArgumentException("Lời mời này đã quá hạn (24 giờ). Vui lòng yêu cầu Admin gửi lại.");
        }

        if ("ACCEPTED".equals(whitelist.getStatus())) {
            return ResponseEntity.ok(ApiResponse.success("Lời mời này đã được chấp nhận trước đó.", whitelist));
        }

        whitelist.setStatus("ACCEPTED");
        whitelist.setConfirmedAt(java.time.LocalDateTime.now());
        whitelistPort.save(whitelist);

        return ResponseEntity.ok(ApiResponse.success("Chấp nhận lời mời thành công!", whitelist));
    }

    @PostMapping("/resend-invitation")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Gửi lại lời mời", description = "Chỉ Admin/SuperAdmin. Tạo token mới và gửi lại email mời.")
    public ResponseEntity<ApiResponse<AdminGoogleWhitelist>> resendInvitation(@RequestParam String email) {
        AdminGoogleWhitelist whitelist = whitelistPort.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new IllegalArgumentException("Email không tồn tại trong danh sách whitelist."));

        if ("ACCEPTED".equals(whitelist.getStatus())) {
            throw new IllegalArgumentException("Tài khoản này đã được xác nhận, không cần gửi lại lời mời.");
        }

        String token = java.util.UUID.randomUUID().toString();
        java.time.LocalDateTime expiry = java.time.LocalDateTime.now().plusDays(1);

        whitelist.setInvitationToken(token);
        whitelist.setTokenExpiredAt(expiry);
        whitelist.setStatus("PENDING");
        
        AdminGoogleWhitelist saved = whitelistPort.save(whitelist);

        String invitationLink = frontendUrl + "/admin/auth/accept-invitation?token=" + token;
        emailServicePort.sendAdminInvitationEmail(saved.getEmail(), invitationLink);

        return ResponseEntity.ok(ApiResponse.success("Đã gửi lại lời mời tới " + saved.getEmail(), saved));
    }

    @DeleteMapping("/{email}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Xóa email khỏi whitelist", description = "Chỉ Admin/SuperAdmin mới có quyền truy cập.")
    public ResponseEntity<ApiResponse<Void>> removeFromWhitelist(@PathVariable String email) {
        whitelistPort.delete(email);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa khỏi danh sách trắng"));
    }

    public record WhitelistRequest(String email, String role) {}
}
