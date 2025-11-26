package fpt.teddypet.application.dto.request.orders.order;

import fpt.teddypet.application.dto.common.SortDirection;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record OrderSearchRequest(
        @Min(value = 0, message = "Page number must be greater than or equal to 0")
        Integer page,

        @Min(value = 1, message = "Page size must be greater than or equal to 1")
        @Max(value = 100, message = "Page size must be less than or equal to 100")
        Integer size,

        String keyword,

        String sortKey,

        String sortDirection
) {
    public OrderSearchRequest {
        // Default values
        if (page == null) {
            page = 0;
        }
        if (size == null) {
            size = 20;
        }
    }

    public OrderSortField getSortField() {
        return OrderSortField.fromFieldName(sortKey);
    }

    public SortDirection getSortDir() {
        return SortDirection.fromString(sortDirection);
    }
}
