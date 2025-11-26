package fpt.teddypet.application.dto.request.products.attribute;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record ProductAttributeValueReorderRequest(
        @NotEmpty(message = "Danh sách giá trị thuộc tính không được rỗng")
        @Valid
        List<ProductAttributeValueOrderItem> items
) {
    public record ProductAttributeValueOrderItem(
            @NotNull(message = "ID giá trị thuộc tính là bắt buộc")
            Long valueId,
            
            @NotNull(message = "Thứ tự hiển thị là bắt buộc")
            Integer displayOrder
    ) {
    }
}


