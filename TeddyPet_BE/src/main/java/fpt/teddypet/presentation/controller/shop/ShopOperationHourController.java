package fpt.teddypet.presentation.controller.shop;

import fpt.teddypet.application.constants.shop.ShopMessages;
import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.request.shop.ShopOperationHourUpsertRequest;
import fpt.teddypet.application.dto.response.shop.ShopOperationHourResponse;
import fpt.teddypet.application.port.input.shop.ShopOperationHourService;
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
@RequestMapping(ApiConstants.API_SHOP_OPERATION_HOURS)
@RequiredArgsConstructor
@Tag(name = "Shop Operation Hours", description = "APIs for managing shop operating hours")
public class ShopOperationHourController {

    private final ShopOperationHourService service;

    @GetMapping
    @Operation(summary = "Get all operation hours (7 days)")
    public ResponseEntity<ApiResponse<List<ShopOperationHourResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(service.getAll()));
    }

    @GetMapping("/day/{dayOfWeek}")
    @Operation(summary = "Get operation hours by day (1=Mon, 7=Sun)")
    public ResponseEntity<ApiResponse<ShopOperationHourResponse>> getByDay(@PathVariable Integer dayOfWeek) {
        return ResponseEntity.ok(ApiResponse.success(service.getByDayOfWeek(dayOfWeek)));
    }

    @PostMapping
    @Operation(summary = "Create or update operation hours for one day")
    public ResponseEntity<ApiResponse<Void>> upsert(@Valid @RequestBody ShopOperationHourUpsertRequest request) {
        service.upsert(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(ShopMessages.MESSAGE_OPERATION_HOUR_UPDATED));
    }

    @PostMapping("/batch")
    @Operation(summary = "Create or update operation hours for all days")
    public ResponseEntity<ApiResponse<Void>> upsertAll(@Valid @RequestBody List<ShopOperationHourUpsertRequest> requests) {
        service.upsertAll(requests);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(ShopMessages.MESSAGE_OPERATION_HOUR_UPDATED));
    }
}
