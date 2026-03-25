package fpt.teddypet.domain.valueobject;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Embeddable
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class Price {
    private BigDecimal amount;
    private BigDecimal saleAmount;

    public static Price of(BigDecimal amount, BigDecimal saleAmount) {
        validate(amount, saleAmount);
        return new Price(amount, saleAmount);
    }

    public static Price of(BigDecimal amount) {
        validate(amount, null);
        return new Price(amount, null);
    }

    private static void validate(BigDecimal amount, BigDecimal saleAmount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Giá phải lớn hơn 0");
        }
        if (saleAmount != null) {
            if (saleAmount.compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("Giá khuyến mãi phải lớn hơn 0");
            }
            if (saleAmount.compareTo(amount) >= 0) {
                throw new IllegalArgumentException("Giá khuyến mãi phải nhỏ hơn giá gốc");
            }
        }
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public BigDecimal getSaleAmount() {
        return saleAmount;
    }

    public static Price toPrice(BigDecimal salePrice, BigDecimal price) {
        if (salePrice == null || salePrice.compareTo(BigDecimal.ZERO) <= 0
                || (price != null && salePrice.compareTo(price) >= 0)) {
            return Price.of(price);
        }
        return Price.of(price, salePrice);
    }

    public BigDecimal getEffectivePrice() {
        if (saleAmount != null && saleAmount.compareTo(BigDecimal.ZERO) > 0) {
            return saleAmount;
        }
        return amount;
    }
}
