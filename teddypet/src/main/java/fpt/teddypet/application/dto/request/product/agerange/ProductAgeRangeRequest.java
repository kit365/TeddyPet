package fpt.teddypet.application.dto.request.product.agerange;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProductAgeRangeRequest(
        @NotBlank(message = "Tên độ tuổi là bắt buộc")
        @Size(max = 50, message = "Tên độ tuổi không được vượt quá 50 ký tự")
        String name,
        
        @Size(max = 255, message = "Mô tả không được vượt quá 255 ký tự")
        String description
) {
}

