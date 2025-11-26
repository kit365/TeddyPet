package fpt.teddypet.application.dto.request.blogs.category;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record BlogCategoryUpsertRequest(
        Long categoryId, // Null when creating new
        @NotBlank(message = "Tên danh mục là bắt buộc")
        @Size(max = 100, message = "Tên danh mục không được vượt quá 100 ký tự")
        String name,
        
        @Size(max = 500, message = "Mô tả không được vượt quá 500 ký tự")
        String description,
        
        @Size(max = 255, message = "URL hình ảnh không được vượt quá 255 ký tự")
        String imageUrl,
        
        Long parentId,
        
        Integer displayOrder // Optional, auto-generated if null
) {
}
