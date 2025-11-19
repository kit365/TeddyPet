package fpt.teddypet.application.dto.request.product;

import fpt.teddypet.domain.enums.PetTypeEnum;
import fpt.teddypet.domain.enums.ProductStatusEnum;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public record ProductRequest(
        @NotBlank(message = "Tên sản phẩm là bắt buộc")
        @Size(max = 200, message = "Tên sản phẩm không được vượt quá 200 ký tự")
        String name,

        @Size(max = 50, message = "Mã vạch không được vượt quá 50 ký tự")
        String barcode,

        @Size(max = 5000, message = "Mô tả không được vượt quá 5000 ký tự")
        String description,

        @Size(max = 255, message = "Meta title không được vượt quá 255 ký tự")
        String metaTitle,

        @Size(max = 500, message = "Meta description không được vượt quá 500 ký tự")
        String metaDescription,

        BigDecimal minPrice,

        BigDecimal maxPrice,

        @Size(max = 100, message = "Xuất xứ không được vượt quá 100 ký tự")
        String origin,

        @Size(max = 100, message = "Chất liệu không được vượt quá 100 ký tự")
        String material,

        List<PetTypeEnum> petTypes,

        ProductStatusEnum status,

        List<Long> categoryIds,

        List<Long> tagIds,

        List<Long> ageRangeIds,

        Long brandId
) {
    // Compact constructor to normalize null lists to empty lists
    public ProductRequest {
        petTypes = petTypes != null ? petTypes : new ArrayList<>();
        categoryIds = categoryIds != null ? categoryIds : new ArrayList<>();
        tagIds = tagIds != null ? tagIds : new ArrayList<>();
        ageRangeIds = ageRangeIds != null ? ageRangeIds : new ArrayList<>();
    }
}

