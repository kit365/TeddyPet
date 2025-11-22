package fpt.teddypet.presentation.controller.product;

import fpt.teddypet.application.constants.products.productimage.ProductImageMessages;
import fpt.teddypet.application.dto.request.product.image.ProductImageSaveRequest;
import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.response.product.image.ProductImageResponse;
import fpt.teddypet.application.port.input.ProductImageService;
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
@RequestMapping(ApiConstants.API_PRODUCT_IMAGES)
@Tag(name = "Hình ảnh sản phẩm", description = "API quản lý hình ảnh sản phẩm")
@RequiredArgsConstructor
public class ProductImageController {

    private final ProductImageService productImageService;

    @PostMapping
    @Operation(summary = "Đồng bộ hình ảnh sản phẩm", description = "Tạo, cập nhật và xóa hình ảnh sản phẩm trong một lần. Hình ảnh có imageId sẽ được cập nhật, không có imageId sẽ được tạo mới, và hình ảnh không có trong danh sách sẽ bị xóa.")
    public ResponseEntity<ApiResponse<List<ProductImageResponse>>> saveImages(
            @Valid @RequestBody ProductImageSaveRequest request) {
        List<ProductImageResponse> responses = productImageService.saveImages(request);
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(ApiResponse.success(ProductImageMessages.MESSAGE_PRODUCT_IMAGES_SAVE_SUCCESS, responses));
    }

    @GetMapping("/{imageId}")
    @Operation(summary = "Lấy hình ảnh sản phẩm theo ID", description = "Lấy thông tin hình ảnh sản phẩm theo ID")
    public ResponseEntity<ApiResponse<ProductImageResponse>> getById(@PathVariable Long imageId) {
        ProductImageResponse response = productImageService.getByIdResponse(imageId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/product/{productId}")
    @Operation(summary = "Lấy danh sách hình ảnh theo sản phẩm", description = "Lấy danh sách tất cả hình ảnh của một sản phẩm")
    public ResponseEntity<ApiResponse<List<ProductImageResponse>>> getByProductId(@PathVariable Long productId) {
        List<ProductImageResponse> responses = productImageService.getByProductId(productId);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }
}

