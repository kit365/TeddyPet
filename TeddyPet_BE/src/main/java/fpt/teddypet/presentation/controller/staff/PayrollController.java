package fpt.teddypet.presentation.controller.staff;

import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.request.staff.PayrollRunRequest;
import fpt.teddypet.application.dto.response.staff.SalaryLogResponse;
import fpt.teddypet.application.port.input.staff.PayrollService;
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
@RequestMapping(ApiConstants.BASE_API + "/staff/payroll")
@RequiredArgsConstructor
@Tag(name = "Lương nhân viên", description = "API tính lương và xem bảng lương nhân viên")
public class PayrollController {

    private final PayrollService payrollService;

    @PostMapping("/run")
    @Operation(summary = "Tính lương tháng", description = "Chạy tính lương tháng cho một nhân viên hoặc toàn bộ nhân viên")
    public ResponseEntity<ApiResponse<List<SalaryLogResponse>>> runPayroll(
            @Valid @RequestBody PayrollRunRequest request) {
        List<SalaryLogResponse> responses = payrollService.runPayroll(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tính lương tháng thành công", responses));
    }

    @GetMapping
    @Operation(summary = "Xem bảng lương theo tháng", description = "Lấy danh sách lương theo tháng/năm, có thể lọc theo nhân viên")
    public ResponseEntity<ApiResponse<List<SalaryLogResponse>>> getByMonthYear(
            @RequestParam Integer month,
            @RequestParam Integer year,
            @RequestParam(required = false) Long staffId) {
        List<SalaryLogResponse> responses = payrollService.getByMonthYear(month, year, staffId);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }
}

