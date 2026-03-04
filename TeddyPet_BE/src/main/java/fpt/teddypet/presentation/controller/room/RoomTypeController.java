package fpt.teddypet.presentation.controller.room;

import fpt.teddypet.application.constants.room.RoomTypeMessages;
import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.request.room.RoomTypeUpsertRequest;
import fpt.teddypet.application.dto.response.room.RoomTypeResponse;
import fpt.teddypet.application.port.input.room.RoomTypeService;
import fpt.teddypet.presentation.constants.ApiConstants;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(ApiConstants.API_ROOM_TYPES)
@RequiredArgsConstructor
@Tag(name = "Room Type", description = "APIs for managing room types")
public class RoomTypeController {

    private final RoomTypeService roomTypeService;

    @PostMapping
    @Operation(summary = "Create or Update Room Type")
    public ResponseEntity<ApiResponse<RoomTypeResponse>> upsert(@Valid @RequestBody RoomTypeUpsertRequest request) {
        RoomTypeResponse response = roomTypeService.upsert(request);
        String message = request.roomTypeId() == null
                ? RoomTypeMessages.MESSAGE_ROOM_TYPE_CREATED_SUCCESS
                : RoomTypeMessages.MESSAGE_ROOM_TYPE_UPDATED_SUCCESS;
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(message, response));
    }

    @GetMapping
    @Operation(summary = "Get Room Types", description = "Optional filter by serviceId")
    public ResponseEntity<ApiResponse<List<RoomTypeResponse>>> getAll(
            @RequestParam(required = false) Long serviceId) {
        return ResponseEntity.ok(ApiResponse.success(roomTypeService.getAll(serviceId)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get Room Type by ID")
    public ResponseEntity<ApiResponse<RoomTypeResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(roomTypeService.getById(id)));
    }

    @PatchMapping("/{id}/service")
    @Operation(summary = "Set or clear service for room type")
    public ResponseEntity<ApiResponse<Void>> updateServiceId(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, Long> body) {
        Long serviceId = body.get("serviceId");
        roomTypeService.updateServiceId(id, serviceId);
        return ResponseEntity.ok(ApiResponse.success(serviceId != null ? "Đã gắn dịch vụ vào loại phòng." : "Đã bỏ gắn dịch vụ."));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete Room Type (soft delete)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        roomTypeService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(RoomTypeMessages.MESSAGE_ROOM_TYPE_DELETED_SUCCESS));
    }
}
