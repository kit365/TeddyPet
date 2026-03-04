package fpt.teddypet.presentation.controller.staff;

import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.request.staff.SkillRequest;
import fpt.teddypet.application.dto.response.staff.SkillResponse;
import fpt.teddypet.application.port.input.staff.SkillService;
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
@RequestMapping(ApiConstants.BASE_API + "/staff/skills")
@RequiredArgsConstructor
@Tag(name = "Danh mục kỹ năng", description = "API quản lý danh mục kỹ năng (Skill) dùng cho nhân viên")
public class SkillController {

    private final SkillService skillService;

    @PostMapping
    @Operation(summary = "Tạo kỹ năng", description = "Tạo mới một kỹ năng trong danh mục")
    public ResponseEntity<ApiResponse<SkillResponse>> create(@Valid @RequestBody SkillRequest request) {
        SkillResponse response = skillService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo kỹ năng thành công", response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật kỹ năng", description = "Cập nhật thông tin một kỹ năng trong danh mục")
    public ResponseEntity<ApiResponse<SkillResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody SkillRequest request) {
        SkillResponse response = skillService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật kỹ năng thành công", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa kỹ năng", description = "Xóa mềm một kỹ năng khỏi danh mục")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        skillService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa kỹ năng thành công"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy kỹ năng theo id", description = "Lấy chi tiết một kỹ năng")
    public ResponseEntity<ApiResponse<SkillResponse>> getById(@PathVariable Long id) {
        SkillResponse response = skillService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @Operation(summary = "Lấy tất cả kỹ năng đang hoạt động", description = "Liệt kê tất cả kỹ năng đang active trong danh mục")
    public ResponseEntity<ApiResponse<List<SkillResponse>>> getAllActive() {
        List<SkillResponse> responses = skillService.getAllActive();
        return ResponseEntity.ok(ApiResponse.success(responses));
    }
}

