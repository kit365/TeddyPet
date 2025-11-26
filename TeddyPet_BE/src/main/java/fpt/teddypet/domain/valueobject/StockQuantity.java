package fpt.teddypet.domain.valueobject;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Embeddable
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class StockQuantity {
    private Integer value;

    public static StockQuantity of(Integer value) {
        if (value == null || value < 0) {
            throw new IllegalArgumentException("Số lượng tồn kho phải >= 0");
        }
        return new StockQuantity(value);
    }

    public Integer getValue() {
        return value;
    }
}

