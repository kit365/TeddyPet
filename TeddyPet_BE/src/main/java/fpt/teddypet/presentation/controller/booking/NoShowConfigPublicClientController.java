package fpt.teddypet.presentation.controller.booking;

import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.response.bookings.NoShowPublicClientResponse;
import fpt.teddypet.application.port.input.bookings.NoShowConfigPublicClientService;
import fpt.teddypet.presentation.constants.ApiConstants;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(ApiConstants.BASE_API + "/no-show-config")
@RequiredArgsConstructor
@Tag(name = "No-Show Config (Client)", description = "Thông tin quy định no-show cho khách đặt lịch")
public class NoShowConfigPublicClientController {

    private final NoShowConfigPublicClientService noShowConfigPublicClientService;

    @GetMapping("/by-service/{serviceId}")
    @Operation(summary = "Lấy quy định no-show theo dịch vụ (công khai)", description = "Trả về null nếu dịch vụ không gán cấu hình no-show hoặc cấu hình không hoạt động.")
    public ResponseEntity<ApiResponse<NoShowPublicClientResponse>> getByServiceId(@PathVariable Long serviceId) {
        return ResponseEntity.ok(ApiResponse.success(
                "OK",
                noShowConfigPublicClientService.getActiveByServiceId(serviceId).orElse(null)));
    }
}
