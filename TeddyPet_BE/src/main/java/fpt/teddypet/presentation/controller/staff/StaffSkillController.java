package fpt.teddypet.presentation.controller.staff;

import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.request.staff.StaffSkillRequest;
import fpt.teddypet.application.dto.response.staff.StaffSkillResponse;
import fpt.teddypet.application.port.input.staff.StaffSkillService;
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
@RequestMapping(ApiConstants.BASE_API + "/staff/skills-map")
@RequiredArgsConstructor
@Tag(name = "Kỹ năng nhân viên", description = "API gán kỹ năng và hoa hồng cho nhân viên")
public class StaffSkillController {

    private final StaffSkillService staffSkillService;

    @PostMapping
    @Operation(summary = "Gán kỹ năng cho nhân viên")
    public ResponseEntity<ApiResponse<StaffSkillResponse>> create(
            @Valid @RequestBody StaffSkillRequest request) {
        StaffSkillResponse response = staffSkillService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Gán kỹ năng cho nhân viên thành công", response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật kỹ năng nhân viên")
    public ResponseEntity<ApiResponse<StaffSkillResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody StaffSkillRequest request) {
        StaffSkillResponse response = staffSkillService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật kỹ năng nhân viên thành công", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa kỹ năng của nhân viên")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        staffSkillService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa kỹ năng nhân viên thành công"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy thông tin kỹ năng nhân viên theo id")
    public ResponseEntity<ApiResponse<StaffSkillResponse>> getById(@PathVariable Long id) {
        StaffSkillResponse response = staffSkillService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/staff/{staffId}")
    @Operation(summary = "Lấy tất cả kỹ năng của một nhân viên")
    public ResponseEntity<ApiResponse<List<StaffSkillResponse>>> getByStaffId(@PathVariable Long staffId) {
        List<StaffSkillResponse> responses = staffSkillService.getByStaffId(staffId);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }
}

