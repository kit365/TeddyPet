package fpt.teddypet.presentation.controller.user;

import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.request.user.UserAddressRequest;
import fpt.teddypet.application.dto.response.user.UserAddressResponse;
import fpt.teddypet.application.port.input.user.UserAddressService;
import fpt.teddypet.application.util.SecurityUtil;
import fpt.teddypet.presentation.constants.ApiConstants;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping(ApiConstants.API_USER_ADDRESSES)
@RequiredArgsConstructor
@Tag(name = "User Address", description = "APIs quản lý địa chỉ người dùng")
public class UserAddressController {

    private final UserAddressService userAddressService;

    @PostMapping
    @Operation(summary = "Tạo địa chỉ mới", description = "Tạo địa chỉ giao hàng mới cho người dùng hiện tại")
    public ResponseEntity<ApiResponse<Void>> create(
            @Valid @RequestBody UserAddressRequest request) {
        UUID userId = SecurityUtil.getCurrentUserId();
        userAddressService.create(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo địa chỉ thành công"));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật địa chỉ", description = "Cập nhật địa chỉ giao hàng theo ID")
    public ResponseEntity<ApiResponse<Void>> update(
            @PathVariable Long id,
            @Valid @RequestBody UserAddressRequest request) {
        UUID userId = SecurityUtil.getCurrentUserId();
        userAddressService.update(id, userId, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật địa chỉ thành công"));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa địa chỉ", description = "Xóa địa chỉ giao hàng theo ID")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        UUID userId = SecurityUtil.getCurrentUserId();
        userAddressService.delete(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Xóa địa chỉ thành công"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết địa chỉ", description = "Lấy chi tiết địa chỉ giao hàng theo ID")
    public ResponseEntity<ApiResponse<UserAddressResponse>> getDetail(@PathVariable Long id) {
        UUID userId = SecurityUtil.getCurrentUserId();
        UserAddressResponse response = userAddressService.getDetail(id, userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách địa chỉ", description = "Lấy tất cả địa chỉ giao hàng của người dùng hiện tại")
    public ResponseEntity<ApiResponse<List<UserAddressResponse>>> getAll() {
        UUID userId = SecurityUtil.getCurrentUserId();
        List<UserAddressResponse> response = userAddressService.getAllByUserId(userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/{id}/default")
    @Operation(summary = "Đặt địa chỉ mặc định", description = "Đặt địa chỉ giao hàng làm địa chỉ mặc định")
    public ResponseEntity<ApiResponse<Void>> setDefault(@PathVariable Long id) {
        UUID userId = SecurityUtil.getCurrentUserId();
        userAddressService.setDefault(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Đặt địa chỉ mặc định thành công"));
    }
}
