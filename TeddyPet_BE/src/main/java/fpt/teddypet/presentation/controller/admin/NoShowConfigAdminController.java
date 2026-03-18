package fpt.teddypet.presentation.controller.admin;

import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.request.bookings.UpsertNoShowConfigRequest;
import fpt.teddypet.application.dto.response.bookings.NoShowConfigResponse;
import fpt.teddypet.application.port.input.bookings.NoShowConfigAdminService;
import fpt.teddypet.presentation.constants.ApiConstants;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(ApiConstants.API_ADMIN_NO_SHOW_CONFIG)
@RequiredArgsConstructor
@Tag(name = "No-Show Config (Admin)", description = "API cấu hình khách không đến (NO-SHOW) cho booking")
public class NoShowConfigAdminController {

    private final NoShowConfigAdminService noShowConfigAdminService;

    @GetMapping
    @Operation(summary = "Lấy cấu hình NO-SHOW hiện tại")
    public ResponseEntity<ApiResponse<NoShowConfigResponse>> getCurrent() {
        NoShowConfigResponse data = noShowConfigAdminService.getCurrent();
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @PutMapping
    @Operation(summary = "Cập nhật cấu hình NO-SHOW (global)")
    public ResponseEntity<ApiResponse<NoShowConfigResponse>> upsert(
            @Valid @RequestBody UpsertNoShowConfigRequest request) {
        NoShowConfigResponse data = noShowConfigAdminService.upsert(request);
        return ResponseEntity.ok(ApiResponse.success(data));
    }
}

