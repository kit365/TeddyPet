package fpt.teddypet.application.dto.request.product.variant;

import fpt.teddypet.domain.enums.UnitEnum;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.List;

public record ProductVariantRequest(

        Long variantId,
        
        @NotNull(message = "ID sản phẩm là bắt buộc")
        Long productId,
        
        @Min(value = 0, message = "Trọng lượng phải >= 0")
        Integer weight,
        
        @Min(value = 0, message = "Chiều dài phải >= 0")
        Integer length,
        
        @Min(value = 0, message = "Chiều rộng phải >= 0")
        Integer width,
        
        @Min(value = 0, message = "Chiều cao phải >= 0")
        Integer height,
        
        @NotNull(message = "Giá là bắt buộc")
        @DecimalMin(value = "0.01", message = "Giá phải lớn hơn 0")
        BigDecimal price,
        
        @DecimalMin(value = "0.01", message = "Giá khuyến mãi phải lớn hơn 0")
        BigDecimal salePrice,
        
        @NotBlank(message = "SKU là bắt buộc")
        @Size(max = 50, message = "SKU không được vượt quá 50 ký tự")
        String sku,
        
        @NotNull(message = "Số lượng tồn kho là bắt buộc")
        @Min(value = 0, message = "Số lượng tồn kho phải >= 0")
        Integer stockQuantity,
        
        @NotNull(message = "Đơn vị là bắt buộc")
        UnitEnum unit,
        
        Long featuredImageId,
        
        List<Long> attributeValueIds
) {
}

