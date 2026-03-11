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
@RequestMapping(ApiConstants.BASE_API + "/booking-deposit-refund-policies")
@RequiredArgsConstructor
@Tag(name = "Booking Deposit Refund Policy (Client)", description = "API lấy danh sách chính sách hoàn cọc cho khách hàng")
public class BookingDepositRefundPolicyClientController {

    private final BookingDepositRefundPolicyClientService clientService;

    @GetMapping
    @Operation(summary = "Lấy danh sách các chính sách hoàn cọc đang hoạt động")
    public ResponseEntity<ApiResponse<List<BookingDepositRefundPolicyResponse>>> getAllActivePolicies() {
        return ResponseEntity.ok(ApiResponse.success(
                "Lấy danh sách chính sách hoàn cọc thành công",
                clientService.getAllActivePolicies()
        ));
    }
}
