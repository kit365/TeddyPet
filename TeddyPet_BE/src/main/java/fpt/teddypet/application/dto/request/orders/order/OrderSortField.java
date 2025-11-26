package fpt.teddypet.application.dto.request.orders.order;

import lombok.Getter;

@Getter
public enum OrderSortField {
    ID("id"),
    CREATED_AT("createdAt"),
    UPDATED_AT("updatedAt"),
    ORDER_CODE("orderCode"),
    FINAL_AMOUNT("finalAmount"),
    STATUS("status");

    private final String fieldName;

    OrderSortField(String fieldName) {
        this.fieldName = fieldName;
    }

    public static OrderSortField fromFieldName(String fieldName) {
        if (fieldName == null || fieldName.trim().isEmpty()) {
            return CREATED_AT;
        }
        for (OrderSortField field : values()) {
            if (field.fieldName.equalsIgnoreCase(fieldName.trim())) {
                return field;
            }
        }
        return CREATED_AT;
    }
}
