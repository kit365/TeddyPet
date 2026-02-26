package fpt.teddypet.presentation.controller.service;

import fpt.teddypet.application.constants.services.servicecombo.ServiceComboMessages;
import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.request.services.combo.ServiceComboUpsertRequest;
import fpt.teddypet.application.dto.response.service.combo.ServiceComboDetailResponse;
import fpt.teddypet.application.dto.response.service.combo.ServiceComboResponse;
import fpt.teddypet.application.port.input.services.ServiceComboServiceInput;
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
@RequestMapping(ApiConstants.API_SERVICE_COMBOS)
@RequiredArgsConstructor
@Tag(name = "Service Combo", description = "APIs for managing service combos")
public class ServiceComboController {

    private final ServiceComboServiceInput serviceComboService;

    @PostMapping
    @Operation(summary = "Create or Update Service Combo", description = "Creates a new service combo or updates an existing one.")
    public ResponseEntity<ApiResponse<Void>> upsert(@Valid @RequestBody ServiceComboUpsertRequest request) {
        serviceComboService.upsert(request);
        String message = request.comboId() == null
                ? ServiceComboMessages.MESSAGE_SERVICE_COMBO_CREATED_SUCCESS
                : ServiceComboMessages.MESSAGE_SERVICE_COMBO_UPDATED_SUCCESS;
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(message));
    }

    @GetMapping
    @Operation(summary = "Get All Service Combos", description = "Retrieves a list of all active service combos with details.")
    public ResponseEntity<ApiResponse<List<ServiceComboDetailResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(serviceComboService.getAllWithDetails()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get Service Combo by ID", description = "Retrieves a service combo by its ID with service items.")
    public ResponseEntity<ApiResponse<ServiceComboDetailResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(serviceComboService.getDetail(id)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete Service Combo", description = "Soft deletes a service combo.")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        serviceComboService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(ServiceComboMessages.MESSAGE_SERVICE_COMBO_DELETED_SUCCESS));
    }
}
