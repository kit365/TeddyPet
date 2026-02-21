package fpt.teddypet.application.dto.request.services.category;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ServiceCategoryUpsertRequest(
        Long categoryId,
        @NotBlank(message = "Tên danh mục dịch vụ là bắt buộc")
        @Size(max = 255, message = "Tên danh mục không được vượt quá 255 ký tự")
        String name,
        @Size(max = 500, message = "Mô tả không được vượt quá 500 ký tự")
        String description,
        @Size(max = 100)
        String serviceType,
        @Size(max = 100)
        String pricingModel,
        @Size(max = 255)
        String metaTitle,
        @Size(max = 500)
        String metaDescription,
        @Size(max = 255)
        String icon,
        @Size(max = 255)
        String imageUrl,
        @Size(max = 20)
        String colorCode,
        Boolean isActive,
        Long parentId,
        Integer displayOrder
) {
}
