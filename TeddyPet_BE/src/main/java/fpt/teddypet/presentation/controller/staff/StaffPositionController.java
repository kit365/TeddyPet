package fpt.teddypet.presentation.controller.staff;

import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.request.staff.StaffPositionRequest;
import fpt.teddypet.application.dto.response.staff.StaffPositionResponse;
import fpt.teddypet.application.port.input.staff.StaffPositionService;
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
@RequestMapping(ApiConstants.BASE_API + "/staff/positions")
@RequiredArgsConstructor
@Tag(name = "Danh mục chức vụ", description = "API quản lý chức vụ nhân viên (Thu ngân, Nhân viên chăm sóc, ...)")
public class StaffPositionController {

    private final StaffPositionService staffPositionService;

    @PostMapping
    @Operation(summary = "Tạo chức vụ", description = "Tạo mới một chức vụ trong danh mục")
    public ResponseEntity<ApiResponse<StaffPositionResponse>> create(@Valid @RequestBody StaffPositionRequest request) {
        StaffPositionResponse response = staffPositionService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo chức vụ thành công", response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật chức vụ", description = "Cập nhật thông tin một chức vụ")
    public ResponseEntity<ApiResponse<StaffPositionResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody StaffPositionRequest request) {
        StaffPositionResponse response = staffPositionService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật chức vụ thành công", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa chức vụ", description = "Xóa mềm một chức vụ")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        staffPositionService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa chức vụ thành công"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chức vụ theo id")
    public ResponseEntity<ApiResponse<StaffPositionResponse>> getById(@PathVariable Long id) {
        StaffPositionResponse response = staffPositionService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @Operation(summary = "Lấy tất cả chức vụ đang hoạt động")
    public ResponseEntity<ApiResponse<List<StaffPositionResponse>>> getAllActive() {
        List<StaffPositionResponse> responses = staffPositionService.getAllActive();
        return ResponseEntity.ok(ApiResponse.success(responses));
    }
}
