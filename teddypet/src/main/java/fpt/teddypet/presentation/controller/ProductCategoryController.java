package fpt.teddypet.presentation.controller;

import fpt.teddypet.application.constants.productcategory.ProductCategoryMessages;
import fpt.teddypet.application.dto.request.ProductCategoryUpsertRequest;
import fpt.teddypet.application.dto.response.ApiResponse;
import fpt.teddypet.application.dto.response.ProductCategoryResponse;
import fpt.teddypet.application.dto.response.ProductCategoryNestedResponse;
import fpt.teddypet.application.port.input.ProductCategoryService;
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
@RequestMapping(ApiConstants.API_PRODUCT_CATEGORIES)
@Tag(name = "Danh mục sản phẩm", description = "API quản lý danh mục sản phẩm")
@RequiredArgsConstructor
public class ProductCategoryController {

    private final ProductCategoryService productCategoryService;

    @PutMapping
    @Operation(summary = "Tạo hoặc cập nhật danh mục sản phẩm", description = "Tạo mới nếu categoryId là null, cập nhật nếu categoryId có giá trị")
    public ResponseEntity<ApiResponse<ProductCategoryResponse>> upsert(
            @Valid @RequestBody ProductCategoryUpsertRequest request) {
        ProductCategoryResponse response = productCategoryService.upsert(request);
        String message = request.categoryId() == null 
                ? ProductCategoryMessages.MESSAGE_PRODUCT_CATEGORY_CREATED_SUCCESS
                : ProductCategoryMessages.MESSAGE_PRODUCT_CATEGORY_UPDATED_SUCCESS;
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(ApiResponse.success(message, response));
    }

    @GetMapping("/{categoryId}")
    @Operation(summary = "Lấy danh mục sản phẩm theo ID", description = "Lấy thông tin danh mục sản phẩm theo ID")
    public ResponseEntity<ApiResponse<ProductCategoryResponse>> getById(@PathVariable Long categoryId) {
        ProductCategoryResponse response = productCategoryService.getByIdResponse(categoryId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @Operation(summary = "Lấy tất cả danh mục sản phẩm", description = "Lấy danh sách tất cả danh mục sản phẩm")
    public ResponseEntity<ApiResponse<List<ProductCategoryResponse>>> getAll() {
        List<ProductCategoryResponse> responses = productCategoryService.getAll();
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/roots")
    @Operation(summary = "Lấy danh sách danh mục cha", description = "Lấy danh sách tất cả danh mục sản phẩm không có parent (danh mục gốc)")
    public ResponseEntity<ApiResponse<List<ProductCategoryResponse>>> getRootCategories() {
        List<ProductCategoryResponse> responses = productCategoryService.getRootCategories();
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/parent/{parentId}/children")
    @Operation(summary = "Lấy danh sách danh mục con", description = "Lấy danh sách tất cả danh mục con của một danh mục cha")
    public ResponseEntity<ApiResponse<List<ProductCategoryResponse>>> getChildCategories(
            @PathVariable Long parentId) {
        List<ProductCategoryResponse> responses = productCategoryService.getChildCategories(parentId);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/nested")
    @Operation(summary = "Lấy danh sách danh mục lồng nhau", description = "Lấy danh sách danh mục sản phẩm theo cấu trúc phân cấp (cha chứa con)")
    public ResponseEntity<ApiResponse<List<ProductCategoryNestedResponse>>> getNestedCategories() {
        List<ProductCategoryNestedResponse> responses = productCategoryService.getNestedCategories();
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @DeleteMapping("/{categoryId}")
    @Operation(summary = "Xóa danh mục sản phẩm", description = "Xóa mềm danh mục sản phẩm theo ID")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long categoryId) {
        productCategoryService.delete(categoryId);
        return ResponseEntity.ok(ApiResponse.success(ProductCategoryMessages.MESSAGE_PRODUCT_CATEGORY_DELETED_SUCCESS));
    }
}

