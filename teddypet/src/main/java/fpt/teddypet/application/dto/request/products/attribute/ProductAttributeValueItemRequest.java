package fpt.teddypet.application.dto.request.products.attribute;

import fpt.teddypet.domain.enums.UnitEnum;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record ProductAttributeValueItemRequest(
        Long valueId,

        @NotBlank(message = "Giá trị thuộc tính không được để trống")
        @Size(max = 255, message = "Giá trị thuộc tính không được vượt quá 255 ký tự")
        String value,

        Integer displayOrder,

        BigDecimal amount,

        UnitEnum unit,

        String displayCode
) {
}


