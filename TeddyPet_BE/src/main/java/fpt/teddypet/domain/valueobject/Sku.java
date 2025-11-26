package fpt.teddypet.domain.valueobject;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Embeddable
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class Sku {
    private String value;

    public static Sku of(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("SKU không được để trống");
        }
        if (value.length() > 50) {
            throw new IllegalArgumentException("SKU không được vượt quá 50 ký tự");
        }
        return new Sku(value);
    }

    public String getValue() {
        return value;
    }
}

