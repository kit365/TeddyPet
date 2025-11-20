package fpt.teddypet.application.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ProductTagRequest(
        @NotBlank(message = "Tên tag là bắt buộc")
        @Size(max = 50, message = "Tên tag không được vượt quá 50 ký tự")
        String name,
        
        @Size(max = 500, message = "Mô tả không được vượt quá 500 ký tự")
        String description,
        
        @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Màu sắc phải theo định dạng hex (#RRGGBB)")
        @Size(max = 20, message = "Màu sắc không được vượt quá 20 ký tự")
        String color
) {
}

