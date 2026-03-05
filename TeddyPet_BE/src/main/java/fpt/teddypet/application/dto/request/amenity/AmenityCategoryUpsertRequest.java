package fpt.teddypet.application.dto.request.amenity;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AmenityCategoryUpsertRequest(
        Long id,
        @NotBlank(message = "Tên danh mục là bắt buộc")
        @Size(max = 255)
        String categoryName,
        @Size(max = 2000)
        String description,
        Integer displayOrder,
        @Size(max = 255)
        String icon,
        Boolean isActive
) {
}
