package fpt.teddypet.presentation.controller.product;

import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.response.product.image.ProductImageResponse;
import fpt.teddypet.application.port.input.products.ProductImageService;
import fpt.teddypet.presentation.constants.ApiConstants;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller chỉ để query hình ảnh sản phẩm.
 * Việc tạo/sửa/xóa hình ảnh được thực hiện thông qua ProductController (POST/PUT /api/products)
 * bằng cách gửi mảng images trong request body.
 */
@RestController
@RequestMapping(ApiConstants.API_PRODUCT_IMAGES)
@Tag(name = "Hình ảnh sản phẩm", description = "API query hình ảnh sản phẩm (Tạo/sửa/xóa thông qua Product API)")
@RequiredArgsConstructor
public class ProductImageController {

    private final ProductImageService productImageService;

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

