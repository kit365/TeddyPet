package fpt.teddypet.presentation.controller.product;

import fpt.teddypet.application.constants.products.productattributevalue.ProductAttributeValueMessages;
import fpt.teddypet.application.dto.request.product.attribute.ProductAttributeValueReorderRequest;
import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.port.input.ProductAttributeValueService;
import fpt.teddypet.presentation.constants.ApiConstants;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(ApiConstants.API_PRODUCT_ATTRIBUTE_VALUES)
@Tag(name = "Giá trị thuộc tính sản phẩm", description = "API quản lý giá trị thuộc tính sản phẩm")
@RequiredArgsConstructor
public class ProductAttributeValueController {

    private final ProductAttributeValueService productAttributeValueService;

    @PutMapping("/reorder")
    @Operation(summary = "Thay đổi vị trí giá trị thuộc tính", 
            description = "Cập nhật thứ tự hiển thị cho danh sách giá trị thuộc tính")
    public ResponseEntity<ApiResponse<Void>> reorder(
            @Valid @RequestBody ProductAttributeValueReorderRequest request) {
        productAttributeValueService.reorder(request);
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(ApiResponse.success(ProductAttributeValueMessages.MESSAGE_PRODUCT_ATTRIBUTE_VALUE_REORDER_SUCCESS));
    }


}


