package fpt.teddypet.presentation.controller.booking;

import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.response.staff.WorkShiftCoverageDayResponse;
import fpt.teddypet.application.port.input.staff.WorkShiftService;
import fpt.teddypet.presentation.constants.ApiConstants;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

/**
 * API public: phủ ca làm theo ngày (sáng/chiều) để form đặt lịch khóa ngày trả khi không có ca.
 */
@RestController
@RequestMapping(ApiConstants.API_BOOKINGS + "/shift-coverage")
@RequiredArgsConstructor
@Tag(name = "Booking - Phủ ca làm", description = "Public: tra cứu ngày có ca sáng/chiều khi đặt lịch")
public class BookingShiftCoverageController {

    private final WorkShiftService workShiftService;

    @GetMapping
    @Operation(summary = "Danh sách ngày kèm cờ sáng/chiều có ca (OPEN/ASSIGNED, không hủy)")
    public ResponseEntity<ApiResponse<List<WorkShiftCoverageDayResponse>>> getCoverage(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        List<WorkShiftCoverageDayResponse> data = workShiftService.getShiftCoverageForBookingForm(from, to);
        return ResponseEntity.ok(ApiResponse.success(data));
    }
}
