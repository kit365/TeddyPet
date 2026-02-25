package fpt.teddypet.application.dto.request.amenity;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AmenityUpsertRequest(
        Long id,
        @NotNull(message = "Danh mục là bắt buộc")
        Long categoryId,
        @Size(max = 500)
        String description,
        @Size(max = 255)
        String icon,
        @Size(max = 255)
        String image,
        Integer displayOrder,
        Boolean isActive
) {
}
