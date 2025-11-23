package fpt.teddypet.application.dto.request.products.image;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ProductImageRequest(
        @NotNull(message = "ID sản phẩm là bắt buộc")
        Long productId,
        
        @NotBlank(message = "URL hình ảnh là bắt buộc")
        @Size(max = 500, message = "URL hình ảnh không được vượt quá 500 ký tự")
        String imageUrl,
        
        @Size(max = 255, message = "Alt text không được vượt quá 255 ký tự")
        String altText,
        
        @Min(value = 0, message = "Thứ tự hiển thị phải lớn hơn hoặc bằng 0")
        Integer displayOrder
) {
}

