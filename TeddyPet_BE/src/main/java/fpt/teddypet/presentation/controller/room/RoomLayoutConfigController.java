package fpt.teddypet.presentation.controller.room;

import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.request.room.RoomLayoutConfigUpsertRequest;
import fpt.teddypet.application.dto.response.room.RoomLayoutConfigResponse;
import fpt.teddypet.application.port.input.room.RoomLayoutConfigService;
import fpt.teddypet.presentation.constants.ApiConstants;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping(ApiConstants.API_ROOM_LAYOUT_CONFIGS)
@RequiredArgsConstructor
@Tag(name = "Room Layout Config", description = "Cấu hình lưới sắp xếp phòng (maxRows, maxCols, status, serviceId)")
public class RoomLayoutConfigController {

    private final RoomLayoutConfigService layoutConfigService;

    @GetMapping
    @Operation(summary = "List all layout configs")
    public ResponseEntity<ApiResponse<List<RoomLayoutConfigResponse>>> getAll(
            @RequestParam(required = false) Long serviceId,
            @RequestParam(required = false) String status
    ) {
        return ResponseEntity.ok(ApiResponse.success(layoutConfigService.getAll(serviceId, status)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get layout config by ID")
    public ResponseEntity<ApiResponse<RoomLayoutConfigResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(layoutConfigService.getById(id)));
    }

    @PostMapping
    @Operation(summary = "Create layout config")
    public ResponseEntity<ApiResponse<RoomLayoutConfigResponse>> create(
            @Valid @RequestBody RoomLayoutConfigUpsertRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo cấu hình layout thành công.", layoutConfigService.create(request)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update layout config")
    public ResponseEntity<ApiResponse<RoomLayoutConfigResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody RoomLayoutConfigUpsertRequest request) {
        RoomLayoutConfigUpsertRequest withId = new RoomLayoutConfigUpsertRequest(
                id, request.layoutName(), request.maxRows(), request.maxCols(),
                request.backgroundImage(), request.serviceId());
        return ResponseEntity
                .ok(ApiResponse.success("Cập nhật layout thành công.", layoutConfigService.update(withId)));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Update layout config status")
    public ResponseEntity<ApiResponse<RoomLayoutConfigResponse>> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String status = body.get("status");
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái thành công.",
                layoutConfigService.updateStatus(id, status)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete layout config")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        layoutConfigService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa cấu hình layout."));
    }
}
