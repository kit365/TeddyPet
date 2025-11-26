package fpt.teddypet.domain.valueobject;

import fpt.teddypet.domain.enums.UnitEnum;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;

import java.math.BigDecimal;

public record Measurement(
        BigDecimal amount,
        @Enumerated(EnumType.STRING)
        UnitEnum unit
) {
    public Measurement {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Số lượng phải lớn hơn hoặc bằng 0");
        }
        if (unit == null) {
            throw new IllegalArgumentException("Đơn vị tính không được để trống");
        }
    }

    public static Measurement of(BigDecimal amount, UnitEnum unit) {
        return new Measurement(amount, unit);
    }

    // Logic nghiệp vụ: Chuyển đổi thành chuỗi hiển thị (để lưu vào cột 'value')
    // Ví dụ: 10 + KG -> "10kg"
    public String toDisplayString() {
        // Giả sử UnitEnum có hàm getSymbol() trả về "kg", "g", "ml"
        //stripTrailingZeros để bỏ các số 0 thừa sau dấu phẩy(e.g., 10.0 → 10), toPlainString để tránh định dạng khoa học
        return amount.stripTrailingZeros().toPlainString() + unit.getSymbol();
    }

    // Logic nghiệp vụ: Quy đổi (Ví dụ sang Gram để tính ship)
    public BigDecimal toGram() {
        if (unit == UnitEnum.KG) return amount.multiply(BigDecimal.valueOf(1000));
        if (unit == UnitEnum.GRAM) return amount;
        throw new UnsupportedOperationException("Không thể quy đổi đơn vị này sang Gram");
    }


}
