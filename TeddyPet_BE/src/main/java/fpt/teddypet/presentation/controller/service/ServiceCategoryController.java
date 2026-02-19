package fpt.teddypet.presentation.controller.service;

import fpt.teddypet.application.constants.services.servicecategory.ServiceCategoryMessages;
import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.request.services.category.ServiceCategoryUpsertRequest;
import fpt.teddypet.application.dto.response.service.category.ServiceCategoryNestedResponse;
import fpt.teddypet.application.dto.response.service.category.ServiceCategoryResponse;
import fpt.teddypet.application.port.input.services.ServiceCategoryService;
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
@RequestMapping(ApiConstants.API_SERVICE_CATEGORIES)
@RequiredArgsConstructor
@Tag(name = "Service Category", description = "APIs for managing service categories")
public class ServiceCategoryController {

    private final ServiceCategoryService serviceCategoryService;

    @PostMapping
    @Operation(summary = "Create or Update Service Category", description = "Creates a new service category or updates an existing one.")
    public ResponseEntity<ApiResponse<Void>> upsert(@Valid @RequestBody ServiceCategoryUpsertRequest request) {
        serviceCategoryService.upsert(request);
        String message = request.categoryId() == null
                ? ServiceCategoryMessages.MESSAGE_SERVICE_CATEGORY_CREATED_SUCCESS
                : ServiceCategoryMessages.MESSAGE_SERVICE_CATEGORY_UPDATED_SUCCESS;
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(message));
    }

    @GetMapping
    @Operation(summary = "Get All Service Categories", description = "Retrieves a list of all active service categories.")
    public ResponseEntity<ApiResponse<List<ServiceCategoryResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(serviceCategoryService.getAll()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get Service Category by ID", description = "Retrieves a service category by its ID.")
    public ResponseEntity<ApiResponse<ServiceCategoryResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(serviceCategoryService.getCategoryDetail(id)));
    }

    @GetMapping("/nested")
    @Operation(summary = "Get Nested Service Categories", description = "Retrieves service categories in a tree structure.")
    public ResponseEntity<ApiResponse<List<ServiceCategoryNestedResponse>>> getNested() {
        return ResponseEntity.ok(ApiResponse.success(serviceCategoryService.getNestedCategories()));
    }

    @GetMapping("/{id}/children")
    @Operation(summary = "Get Child Categories", description = "Retrieves child categories of a parent category.")
    public ResponseEntity<ApiResponse<List<ServiceCategoryResponse>>> getChildren(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(serviceCategoryService.getChildCategories(id)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete Service Category", description = "Soft deletes a service category.")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        serviceCategoryService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(ServiceCategoryMessages.MESSAGE_SERVICE_CATEGORY_DELETED_SUCCESS));
    }
}
