package fpt.teddypet.presentation.controller.pet;

import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.request.pet.PetProfileRequest;
import fpt.teddypet.application.dto.response.pet.PetProfileResponse;
import fpt.teddypet.application.port.input.AuthService;
import fpt.teddypet.application.port.input.pet.PetProfileService;
import fpt.teddypet.domain.entity.User;
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
@RequestMapping(ApiConstants.API_PET_PROFILES)
@RequiredArgsConstructor
@Tag(name = "Hồ sơ thú cưng", description = "API quản lý hồ sơ thú cưng của người dùng đăng nhập")
public class PetProfileController {

    private final PetProfileService petProfileService;
    private final AuthService authService;

    @GetMapping
    @Operation(summary = "Danh sách thú cưng của tôi", description = "Lấy tất cả hồ sơ thú cưng của người dùng đang đăng nhập.")
    public ResponseEntity<ApiResponse<List<PetProfileResponse>>> getMyPets() {
        User user = authService.getCurrentUser();
        List<PetProfileResponse> list = petProfileService.getByUserId(user.getId());
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Chi tiết một thú cưng", description = "Lấy chi tiết hồ sơ thú cưng theo id (chỉ của user đăng nhập).")
    public ResponseEntity<ApiResponse<PetProfileResponse>> getById(@PathVariable Long id) {
        User user = authService.getCurrentUser();
        PetProfileResponse response = petProfileService.getById(id, user.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    @Operation(summary = "Đăng ký thú cưng mới", description = "Tạo hồ sơ thú cưng mới cho user đăng nhập.")
    public ResponseEntity<ApiResponse<PetProfileResponse>> create(@Valid @RequestBody PetProfileRequest request) {
        User user = authService.getCurrentUser();
        PetProfileResponse response = petProfileService.create(user.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Đã đăng ký thú cưng thành công.", response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật hồ sơ thú cưng", description = "Cập nhật thông tin hồ sơ thú cưng (chỉ của user đăng nhập).")
    public ResponseEntity<ApiResponse<PetProfileResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody PetProfileRequest request) {
        User user = authService.getCurrentUser();
        PetProfileResponse response = petProfileService.update(id, user.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thành công.", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa hồ sơ thú cưng", description = "Xóa hồ sơ thú cưng (chỉ của user đăng nhập).")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        User user = authService.getCurrentUser();
        petProfileService.delete(id, user.getId());
        return ResponseEntity.noContent().build();
    }
}
