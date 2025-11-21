package fpt.teddypet.application.dto.request.product.variant;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record ProductVariantSaveRequest(
        @NotNull(message = "ID sản phẩm là bắt buộc")
        Long productId,
        
        @Size(max = 100, message = "Không thể quản lý quá 100 biến thể trong một lần")
        @Valid
        List<ProductVariantRequest> variants
) {
}

