package fpt.teddypet.presentation.controller.booking;

import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.response.bookings.BookingDepositRefundPolicyResponse;
import fpt.teddypet.application.port.input.bookings.BookingDepositRefundPolicyClientService;
import fpt.teddypet.presentation.constants.ApiConstants;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping(ApiConstants.BASE_API + "/booking-refund-policies")
@RequiredArgsConstructor
@Tag(name = "Booking Refund Policy (Client)", description = "API lấy danh sách chính sách hoàn tiền cho khách hàng")
public class BookingRefundPolicyClientController {

    private final BookingDepositRefundPolicyClientService clientService;

    @GetMapping
    @Operation(summary = "Lấy danh sách các chính sách hoàn tiền đang hoạt động")
    public ResponseEntity<ApiResponse<List<BookingDepositRefundPolicyResponse>>> getAllActivePolicies() {
        return ResponseEntity.ok(ApiResponse.success(
                "Lấy danh sách chính sách hoàn tiền thành công",
                clientService.getAllActivePolicies()
        ));
    }
}
