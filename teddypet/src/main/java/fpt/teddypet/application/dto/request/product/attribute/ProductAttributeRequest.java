package fpt.teddypet.application.dto.request.product.attribute;

import fpt.teddypet.domain.enums.AttributeDisplayType;
import fpt.teddypet.domain.enums.UnitEnum;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record ProductAttributeRequest(
        @NotBlank(message = "Tên thuộc tính là bắt buộc")
        @Size(max = 100, message = "Tên thuộc tính không được vượt quá 100 ký tự")
        String name,

        @NotNull(message = "Kiểu hiển thị là bắt buộc")
        AttributeDisplayType displayType,

        Integer displayOrder,

        @Valid
        List<ProductAttributeValueItemRequest> values,

        List<UnitEnum> supportedUnits
) {
}


