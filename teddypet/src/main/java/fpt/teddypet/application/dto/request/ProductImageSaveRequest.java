package fpt.teddypet.application.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record ProductImageSaveRequest(
        @NotNull(message = "ID sản phẩm là bắt buộc")
        Long productId,
        
        @Size(max = 50, message = "Không thể quản lý quá 50 hình ảnh trong một lần")
        @Valid
        List<ProductImageItemRequest> images
) {
}

