package fpt.teddypet.application.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record ProductVariantBatchRequest(
        @NotEmpty(message = "Danh sách biến thể sản phẩm không được rỗng")
        @Size(max = 100, message = "Không thể tạo quá 100 biến thể trong một lần")
        @Valid
        List<ProductVariantRequest> variants
) {
}

