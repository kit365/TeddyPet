package fpt.teddypet.application.dto.request.product.brand;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProductBrandRequest(
        @NotBlank(message = "Tên thương hiệu là bắt buộc")
        @Size(max = 100, message = "Tên thương hiệu không được vượt quá 100 ký tự")
        String name,
        
        @Size(max = 500, message = "Mô tả không được vượt quá 500 ký tự")
        String description,
        
        @Size(max = 255, message = "URL logo không được vượt quá 255 ký tự")
        String logoUrl,
        
        @Size(max = 255, message = "URL website không được vượt quá 255 ký tự")
        String websiteUrl
) {
}

