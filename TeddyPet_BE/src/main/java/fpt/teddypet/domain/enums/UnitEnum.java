package fpt.teddypet.domain.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum UnitEnum {
    // --- NHÓM BÁN HÀNG (SALES) ---
    PIECE("Cái", "cái", UnitCategory.SALES),
    BOX("Hộp", "hộp", UnitCategory.SALES),
    PACK("Gói", "gói", UnitCategory.SALES),
    BAG("Túi", "túi", UnitCategory.SALES),
    BOTTLE("Chai", "chai", UnitCategory.SALES),
    CAN("Lon", "lon", UnitCategory.SALES),
    SET("Bộ", "bộ", UnitCategory.SALES),
    COMBO("Combo", "combo", UnitCategory.SALES),

    // --- NHÓM ĐO LƯỜNG (MEASUREMENT) ---
    KG("Kilogram", "kg", UnitCategory.MEASUREMENT),
    GRAM("Gram", "g", UnitCategory.MEASUREMENT),
    LITER("Lít", "l", UnitCategory.MEASUREMENT),
    ML("Mililit", "ml", UnitCategory.MEASUREMENT),
    MM("Milimet", "mm", UnitCategory.MEASUREMENT),
    CM("Centimet", "cm", UnitCategory.MEASUREMENT),
    M("Mét", "m", UnitCategory.MEASUREMENT);

    private final String label;   // Tên hiển thị
    private final String symbol;  // Ký hiệu viết tắt
    private final UnitCategory category; // Phân loại

    // --- ĐỊNH NGHĨA CATEGORY TẠI ĐÂY ---
    public enum UnitCategory {
        SALES,      // Đơn vị bán
        MEASUREMENT // Đơn vị đo lường
    }
}

