package fpt.teddypet.presentation.controller.shop;

import fpt.teddypet.application.constants.shop.ShopMessages;
import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.request.shop.TimeSlotUpsertRequest;
import fpt.teddypet.application.dto.response.shop.TimeSlotResponse;
import fpt.teddypet.application.port.input.shop.TimeSlotService;
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
@RequestMapping(ApiConstants.API_TIME_SLOTS)
@RequiredArgsConstructor
@Tag(name = "Time Slots", description = "APIs for managing time slots per service")
public class TimeSlotController {

    private final TimeSlotService service;

    @GetMapping("/service/{serviceId}")
    @Operation(summary = "Get time slots by service ID")
    public ResponseEntity<ApiResponse<List<TimeSlotResponse>>> getByServiceId(@PathVariable Long serviceId) {
        return ResponseEntity.ok(ApiResponse.success(service.getByServiceId(serviceId)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get time slot by ID")
    public ResponseEntity<ApiResponse<TimeSlotResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.getById(id)));
    }

    @PostMapping
    @Operation(summary = "Create or update time slot")
    public ResponseEntity<ApiResponse<Void>> upsert(@Valid @RequestBody TimeSlotUpsertRequest request) {
        service.upsert(request);
        String message = request.id() == null
                ? ShopMessages.MESSAGE_TIME_SLOT_CREATED
                : ShopMessages.MESSAGE_TIME_SLOT_UPDATED;
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(message));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete time slot")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success(ShopMessages.MESSAGE_TIME_SLOT_DELETED));
    }
}
