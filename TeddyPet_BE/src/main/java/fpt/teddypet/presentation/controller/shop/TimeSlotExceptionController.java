package fpt.teddypet.presentation.controller.shop;

import fpt.teddypet.application.constants.shop.ShopMessages;
import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.request.shop.TimeSlotExceptionUpsertRequest;
import fpt.teddypet.application.dto.response.shop.TimeSlotExceptionResponse;
import fpt.teddypet.application.port.input.shop.TimeSlotExceptionService;
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
@RequestMapping(ApiConstants.API_TIME_SLOT_EXCEPTIONS)
@RequiredArgsConstructor
@Tag(name = "Time Slot Exceptions", description = "APIs for managing time slot exceptions (holidays, maintenance, etc.)")
public class TimeSlotExceptionController {

    private final TimeSlotExceptionService service;

    @GetMapping
    @Operation(summary = "Get all exceptions")
    public ResponseEntity<ApiResponse<List<TimeSlotExceptionResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(service.getAll()));
    }

    @GetMapping("/service/{serviceId}")
    @Operation(summary = "Get exceptions by service ID")
    public ResponseEntity<ApiResponse<List<TimeSlotExceptionResponse>>> getByServiceId(@PathVariable Long serviceId) {
        return ResponseEntity.ok(ApiResponse.success(service.getByServiceId(serviceId)));
    }

    @GetMapping("/store")
    @Operation(summary = "Get store-wide exceptions (serviceId = null)")
    public ResponseEntity<ApiResponse<List<TimeSlotExceptionResponse>>> getStoreWide() {
        return ResponseEntity.ok(ApiResponse.success(service.getByServiceId(null)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get exception by ID")
    public ResponseEntity<ApiResponse<TimeSlotExceptionResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.getById(id)));
    }

    @PostMapping
    @Operation(summary = "Create or update exception")
    public ResponseEntity<ApiResponse<Void>> upsert(@Valid @RequestBody TimeSlotExceptionUpsertRequest request) {
        service.upsert(request);
        String message = request.id() == null
                ? ShopMessages.MESSAGE_TIME_SLOT_EXCEPTION_CREATED
                : ShopMessages.MESSAGE_TIME_SLOT_EXCEPTION_UPDATED;
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(message));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete exception")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success(ShopMessages.MESSAGE_TIME_SLOT_EXCEPTION_DELETED));
    }
}
