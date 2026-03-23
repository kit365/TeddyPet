package fpt.teddypet.presentation.controller.admin;

import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.request.bookings.SetNoShowConfigServicesRequest;
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

import java.util.List;

@RestController
@RequestMapping(ApiConstants.API_ADMIN_NO_SHOW_CONFIG)
@RequiredArgsConstructor
@Tag(name = "No-Show Config (Admin)", description = "Quản lý cấu hình NO-SHOW theo bản ghi + dịch vụ áp dụng")
public class NoShowConfigAdminController {

    private final NoShowConfigAdminService noShowConfigAdminService;

    @GetMapping
    @Operation(summary = "Danh sách cấu hình NO-SHOW")
    public ResponseEntity<ApiResponse<List<NoShowConfigResponse>>> list() {
        return ResponseEntity.ok(ApiResponse.success(noShowConfigAdminService.listAll()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Chi tiết cấu hình NO-SHOW (kèm danh sách dịch vụ áp dụng)")
    public ResponseEntity<ApiResponse<NoShowConfigResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(noShowConfigAdminService.getById(id)));
    }

    @PostMapping
    @Operation(summary = "Tạo cấu hình NO-SHOW mới")
    public ResponseEntity<ApiResponse<NoShowConfigResponse>> create(
            @Valid @RequestBody UpsertNoShowConfigRequest request) {
        return ResponseEntity.ok(ApiResponse.success(noShowConfigAdminService.create(request)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật cấu hình NO-SHOW (serviceIds null = giữ nguyên dịch vụ)")
    public ResponseEntity<ApiResponse<NoShowConfigResponse>> update(
            @PathVariable Long id, @Valid @RequestBody UpsertNoShowConfigRequest request) {
        return ResponseEntity.ok(ApiResponse.success(noShowConfigAdminService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa mềm cấu hình NO-SHOW")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        noShowConfigAdminService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PutMapping("/{id}/services")
    @Operation(summary = "Thay thế toàn bộ danh sách dịch vụ áp dụng cho cấu hình này")
    public ResponseEntity<ApiResponse<NoShowConfigResponse>> replaceServices(
            @PathVariable Long id, @Valid @RequestBody SetNoShowConfigServicesRequest request) {
        return ResponseEntity.ok(ApiResponse.success(noShowConfigAdminService.replaceServices(id, request)));
    }
}
