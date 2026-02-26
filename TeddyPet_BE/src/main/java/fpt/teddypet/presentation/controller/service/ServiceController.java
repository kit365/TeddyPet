package fpt.teddypet.presentation.controller.service;

import fpt.teddypet.application.constants.services.service.ServiceMessages;
import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.request.services.service.ServiceUpsertRequest;
import fpt.teddypet.application.dto.response.service.pricing.ServicePricingResponse;
import fpt.teddypet.application.dto.response.service.service.ServiceResponse;
import fpt.teddypet.application.port.input.services.ServicePricingService;
import fpt.teddypet.application.port.input.services.ServiceService;
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
@RequestMapping(ApiConstants.API_SERVICES)
@RequiredArgsConstructor
@Tag(name = "Service", description = "APIs for managing services")
public class ServiceController {

    private final ServiceService serviceService;
    private final ServicePricingService servicePricingService;

    @PostMapping
    @Operation(summary = "Create or Update Service", description = "Creates a new service or updates an existing one.")
    public ResponseEntity<ApiResponse<ServiceResponse>> upsert(@Valid @RequestBody ServiceUpsertRequest request) {
        ServiceResponse saved = serviceService.upsert(request);
        String message = request.serviceId() == null
                ? ServiceMessages.MESSAGE_SERVICE_CREATED_SUCCESS
                : ServiceMessages.MESSAGE_SERVICE_UPDATED_SUCCESS;
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(message, saved));
    }

    @GetMapping
    @Operation(summary = "Get All Services", description = "Retrieves a list of all active services. Optional isRequiredRoom=true to filter only services that require room.")
    public ResponseEntity<ApiResponse<List<ServiceResponse>>> getAll(
            @RequestParam(required = false) Boolean isRequiredRoom) {
        return ResponseEntity.ok(ApiResponse.success(serviceService.getAll(isRequiredRoom)));
    }

    @GetMapping("/category/{categoryId}")
    @Operation(summary = "Get Services by Category", description = "Retrieves services belonging to a category.")
    public ResponseEntity<ApiResponse<List<ServiceResponse>>> getByCategoryId(@PathVariable Long categoryId) {
        return ResponseEntity.ok(ApiResponse.success(serviceService.getByCategoryId(categoryId)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get Service by ID", description = "Retrieves a service by its ID.")
    public ResponseEntity<ApiResponse<ServiceResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(serviceService.getDetail(id)));
    }

    @GetMapping("/{id}/pricings")
    @Operation(summary = "Get Pricing Rules for Service", description = "Retrieves active pricing rules for the service.")
    public ResponseEntity<ApiResponse<List<ServicePricingResponse>>> getPricings(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(servicePricingService.getByServiceId(id)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete Service", description = "Soft deletes a service.")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        serviceService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(ServiceMessages.MESSAGE_SERVICE_DELETED_SUCCESS));
    }
}
