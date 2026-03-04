package fpt.teddypet.presentation.controller.room;

import fpt.teddypet.application.constants.room.RoomMessages;
import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.request.room.RoomBlockingCreateRequest;
import fpt.teddypet.application.dto.response.room.RoomBlockingResponse;
import fpt.teddypet.application.port.input.room.RoomBlockingService;
import fpt.teddypet.presentation.constants.ApiConstants;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(ApiConstants.API_ROOM_BLOCKINGS)
@RequiredArgsConstructor
@Tag(name = "Room Blocking", description = "APIs for room blockings (tạo khóa phòng; khi tạo thành công mới set room.status = BLOCKED)")
public class RoomBlockingController {

    private final RoomBlockingService roomBlockingService;

    @PostMapping
    @Operation(summary = "Tạo khóa phòng", description = "Tạo bản ghi Room_Blockings; khi thành công tự động set room.status = BLOCKED (user không được set BLOCKED trực tiếp trên phòng)")
    public ResponseEntity<ApiResponse<RoomBlockingResponse>> create(@Valid @RequestBody RoomBlockingCreateRequest request) {
        RoomBlockingResponse response = roomBlockingService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(RoomMessages.MESSAGE_ROOM_BLOCKING_CREATED_SUCCESS, response));
    }
}
