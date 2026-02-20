package fpt.teddypet.presentation.controller.service;

import fpt.teddypet.application.constants.services.servicepricing.ServicePricingMessages;
import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.request.services.pricing.ServicePricingUpsertRequest;
import fpt.teddypet.application.dto.response.service.pricing.ServicePricingResponse;
import fpt.teddypet.application.port.input.services.ServicePricingService;
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
@RequestMapping(ApiConstants.API_SERVICE_PRICINGS)
@RequiredArgsConstructor
@Tag(name = "Service Pricing", description = "APIs for managing service pricing rules")
public class ServicePricingController {

    private final ServicePricingService servicePricingService;

    @PostMapping
    @Operation(summary = "Create or Update Service Pricing", description = "Creates or updates a pricing rule for a service.")
    public ResponseEntity<ApiResponse<Void>> upsert(@Valid @RequestBody ServicePricingUpsertRequest request) {
        servicePricingService.upsert(request);
        String message = request.pricingId() == null
                ? ServicePricingMessages.MESSAGE_SERVICE_PRICING_CREATED_SUCCESS
                : ServicePricingMessages.MESSAGE_SERVICE_PRICING_UPDATED_SUCCESS;
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(message));
    }

    @GetMapping
    @Operation(summary = "Get Pricing Rules by Service ID", description = "Retrieves active pricing rules for a service.")
    public ResponseEntity<ApiResponse<List<ServicePricingResponse>>> getByServiceId(@RequestParam Long serviceId) {
        return ResponseEntity.ok(ApiResponse.success(servicePricingService.getByServiceId(serviceId)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get Service Pricing by ID", description = "Retrieves a pricing rule by its ID.")
    public ResponseEntity<ApiResponse<ServicePricingResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(servicePricingService.getDetail(id)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete Service Pricing", description = "Soft deletes a pricing rule.")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        servicePricingService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(ServicePricingMessages.MESSAGE_SERVICE_PRICING_DELETED_SUCCESS));
    }
}
