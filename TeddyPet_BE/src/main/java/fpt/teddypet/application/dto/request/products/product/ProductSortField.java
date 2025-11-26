package fpt.teddypet.application.dto.request.products.product;


import lombok.Getter;

@Getter
public enum ProductSortField {
    ID("id"),
    CREATED_AT("createdAt"),
    UPDATED_AT("updatedAt"),
    MIN_PRICE("minPrice"),
    SOLD_COUNT("soldCount");

    private final String fieldName;

    ProductSortField(String fieldName) {
        this.fieldName = fieldName;
    }

    /**
     * Tìm ProductSortField theo field name (case-insensitive)
     * Trả về ID nếu không tìm thấy (default)
     */
    public static ProductSortField fromFieldName(String fieldName) {
        if (fieldName == null || fieldName.trim().isEmpty()) {
            return ID;
        }
        for (ProductSortField field : values()) {
            if (field.fieldName.equalsIgnoreCase(fieldName.trim())) {
                return field;
            }
        }
        return ID;
    }
}

