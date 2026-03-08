package fpt.teddypet.application.dto.request.products.category;

import fpt.teddypet.domain.enums.PetTypeEnum;
import fpt.teddypet.domain.enums.ProductCategoryTypeEnum;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record ProductCategoryUpsertRequest(
        Long categoryId, // Null khi tạo mới
        @NotBlank(message = "Tên danh mục là bắt buộc")
        @Size(max = 100, message = "Tên danh mục không được vượt quá 100 ký tự")
        String name,

        @Size(max = 500, message = "Mô tả không được vượt quá 500 ký tự")
        String description,

        @Size(max = 255, message = "URL hình ảnh không được vượt quá 255 ký tự")
        String imageUrl,

        Long parentId,

        /** Loại danh mục: FOOD, ACCESSORY, TOY, HYGIENE, ... */
        ProductCategoryTypeEnum categoryType,

        /** Loại thú cưng phù hợp: DOG, CAT, OTHER */
        List<PetTypeEnum> suitablePetTypes
) {
}

