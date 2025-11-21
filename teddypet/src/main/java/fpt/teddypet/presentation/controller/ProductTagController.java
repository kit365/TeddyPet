package fpt.teddypet.presentation.controller;

import fpt.teddypet.application.constants.producttag.ProductTagMessages;
import fpt.teddypet.application.dto.request.product.tag.ProductTagRequest;
import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.response.product.tag.ProductTagResponse;
import fpt.teddypet.application.port.input.ProductTagService;
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
@RequestMapping(ApiConstants.API_PRODUCT_TAGS)
@Tag(name = "Tag sản phẩm", description = "API quản lý tag sản phẩm")
@RequiredArgsConstructor
public class ProductTagController {

    private final ProductTagService productTagService;

    @PostMapping
    @Operation(summary = "Tạo tag sản phẩm", description = "Tạo tag sản phẩm mới")
    public ResponseEntity<ApiResponse<ProductTagResponse>> create(
            @Valid @RequestBody ProductTagRequest request) {
        ProductTagResponse response = productTagService.create(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(ProductTagMessages.MESSAGE_PRODUCT_TAG_CREATED_SUCCESS, response));
    }

    @PutMapping("/{tagId}")
    @Operation(summary = "Cập nhật tag sản phẩm", description = "Cập nhật thông tin tag sản phẩm")
    public ResponseEntity<ApiResponse<ProductTagResponse>> update(
            @PathVariable Long tagId,
            @Valid @RequestBody ProductTagRequest request) {
        ProductTagResponse response = productTagService.update(tagId, request);
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(ApiResponse.success(ProductTagMessages.MESSAGE_PRODUCT_TAG_UPDATED_SUCCESS, response));
    }

    @GetMapping("/{tagId}")
    @Operation(summary = "Lấy tag sản phẩm theo ID", description = "Lấy thông tin tag sản phẩm theo ID")
    public ResponseEntity<ApiResponse<ProductTagResponse>> getById(@PathVariable Long tagId) {
        ProductTagResponse response = productTagService.getByIdResponse(tagId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @Operation(summary = "Lấy tất cả tag sản phẩm", description = "Lấy danh sách tất cả tag sản phẩm")
    public ResponseEntity<ApiResponse<List<ProductTagResponse>>> getAll() {
        List<ProductTagResponse> responses = productTagService.getAll();
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @DeleteMapping("/{tagId}")
    @Operation(summary = "Xóa tag sản phẩm", description = "Xóa mềm tag sản phẩm theo ID")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long tagId) {
        productTagService.delete(tagId);
        return ResponseEntity.ok(ApiResponse.success(ProductTagMessages.MESSAGE_PRODUCT_TAG_DELETED_SUCCESS));
    }
}

