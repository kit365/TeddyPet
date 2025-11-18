package fpt.teddypet.application.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProductImageItemRequest(
        Long imageId, // null nếu là tạo mới
        
        @NotBlank(message = "URL hình ảnh là bắt buộc")
        @Size(max = 500, message = "URL hình ảnh không được vượt quá 500 ký tự")
        String imageUrl,
        
        @Size(max = 255, message = "Alt text không được vượt quá 255 ký tự")
        String altText,
        
        @Min(value = 0, message = "Thứ tự hiển thị phải lớn hơn hoặc bằng 0")
        Integer displayOrder
) {
}

