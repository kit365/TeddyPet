package fpt.teddypet.presentation.controller.room;

import fpt.teddypet.application.constants.room.RoomMessages;
import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.request.room.RoomSetPositionRequest;
import fpt.teddypet.application.dto.request.room.RoomUpsertRequest;
import fpt.teddypet.application.dto.response.room.RoomResponse;
import fpt.teddypet.application.port.input.room.RoomService;
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
@RequestMapping(ApiConstants.API_ROOMS)
@RequiredArgsConstructor
@Tag(name = "Room", description = "APIs for managing rooms")
public class RoomController {

    private final RoomService roomService;

    @PostMapping
    @Operation(summary = "Create or Update Room")
    public ResponseEntity<ApiResponse<RoomResponse>> upsert(@Valid @RequestBody RoomUpsertRequest request) {
        RoomResponse response = roomService.upsert(request);
        String message = request.roomId() == null
                ? RoomMessages.MESSAGE_ROOM_CREATED_SUCCESS
                : RoomMessages.MESSAGE_ROOM_UPDATED_SUCCESS;
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(message, response));
    }

    @GetMapping
    @Operation(summary = "Get Rooms", description = "Optional filter by roomTypeId")
    public ResponseEntity<ApiResponse<List<RoomResponse>>> getAll(
            @RequestParam(required = false) Long roomTypeId) {
        return ResponseEntity.ok(ApiResponse.success(roomService.getAll(roomTypeId)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get Room by ID")
    public ResponseEntity<ApiResponse<RoomResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(roomService.getById(id)));
    }

    @PutMapping("/{id}/position")
    @Operation(summary = "Set room position on layout grid (sắp xếp vị trí phòng)")
    public ResponseEntity<ApiResponse<RoomResponse>> setRoomPosition(
            @PathVariable Long id,
            @Valid @RequestBody RoomSetPositionRequest request) {
        try {
            RoomResponse response = roomService.setRoomPosition(id, request);
            return ResponseEntity.ok(ApiResponse.success("Đã đặt vị trí phòng.", response));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete Room (soft delete)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        roomService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(RoomMessages.MESSAGE_ROOM_DELETED_SUCCESS));
    }
}
