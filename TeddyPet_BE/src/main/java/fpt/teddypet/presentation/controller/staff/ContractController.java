package fpt.teddypet.presentation.controller.staff;

import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.request.staff.ContractRequest;
import fpt.teddypet.application.dto.response.staff.ContractResponse;
import fpt.teddypet.application.port.input.staff.ContractService;
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
@RequestMapping(ApiConstants.BASE_API + "/staff/contracts")
@RequiredArgsConstructor
@Tag(name = "Hợp đồng nhân viên", description = "API quản lý hợp đồng lao động")
public class ContractController {

    private final ContractService contractService;

    @PostMapping
    @Operation(summary = "Tạo hợp đồng")
    public ResponseEntity<ApiResponse<ContractResponse>> create(
            @Valid @RequestBody ContractRequest request) {
        ContractResponse response = contractService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo hợp đồng thành công", response));
    }

    @PutMapping("/{contractId}")
    @Operation(summary = "Cập nhật hợp đồng")
    public ResponseEntity<ApiResponse<ContractResponse>> update(
            @PathVariable Long contractId,
            @Valid @RequestBody ContractRequest request) {
        ContractResponse response = contractService.update(contractId, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật hợp đồng thành công", response));
    }

    @DeleteMapping("/{contractId}")
    @Operation(summary = "Xóa hợp đồng (soft delete)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long contractId) {
        contractService.delete(contractId);
        return ResponseEntity.ok(ApiResponse.success("Xóa hợp đồng thành công"));
    }

    @GetMapping("/{contractId}")
    @Operation(summary = "Lấy chi tiết hợp đồng theo id")
    public ResponseEntity<ApiResponse<ContractResponse>> getById(@PathVariable Long contractId) {
        ContractResponse response = contractService.getById(contractId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/staff/{staffId}")
    @Operation(summary = "Lấy danh sách hợp đồng theo nhân viên")
    public ResponseEntity<ApiResponse<List<ContractResponse>>> getByStaffId(@PathVariable Long staffId) {
        List<ContractResponse> responses = contractService.getByStaffId(staffId);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }
}
