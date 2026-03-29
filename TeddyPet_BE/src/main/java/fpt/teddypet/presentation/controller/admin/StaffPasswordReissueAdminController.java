package fpt.teddypet.presentation.controller.admin;

import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.request.auth.StaffPasswordReissueConfirmRequest;
import fpt.teddypet.application.dto.response.auth.StaffPasswordReissuePreviewResponse;
import fpt.teddypet.application.constants.auth.StaffPasswordReissueMessages;
import fpt.teddypet.application.port.input.auth.StaffPasswordReissueService;
import fpt.teddypet.presentation.constants.ApiConstants;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(ApiConstants.API_ADMIN_STAFF_PASSWORD_REISSUE)
@RequiredArgsConstructor
@Tag(name = "Staff password reissue (Admin)", description = "Duyệt cấp lại mật khẩu nhân viên")
public class StaffPasswordReissueAdminController {

    private final StaffPasswordReissueService staffPasswordReissueService;

    @GetMapping("/preview")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Xem trước yêu cầu cấp lại mật khẩu nhân viên")
    public ResponseEntity<ApiResponse<StaffPasswordReissuePreviewResponse>> preview(@RequestParam String token) {
        StaffPasswordReissuePreviewResponse data = staffPasswordReissueService.previewForAdmin(token);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @PostMapping("/confirm")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Xác nhận cấp mật khẩu tạm cho nhân viên")
    public ResponseEntity<ApiResponse<Void>> confirm(@Valid @RequestBody StaffPasswordReissueConfirmRequest request) {
        staffPasswordReissueService.confirmReissue(request.token());
        return ResponseEntity.ok(ApiResponse.success(StaffPasswordReissueMessages.MESSAGE_CONFIRM_SUCCESS));
    }
}
