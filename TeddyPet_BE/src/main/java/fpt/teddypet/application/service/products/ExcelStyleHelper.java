package fpt.teddypet.application.service.products;

import org.apache.poi.ss.usermodel.*;

/**
 * Utility tập trung toàn bộ logic tạo CellStyle cho Excel.
 * Service chính không cần quan tâm đến màu sắc, font chữ.
 */
public final class ExcelStyleHelper {

    private ExcelStyleHelper() {
    }

    /** Header xanh dương - cột sản phẩm có thể chỉnh sửa */
    public static CellStyle productHeaderStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.LIGHT_BLUE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setLocked(false); // Không khóa - cho phép chỉnh sửa
        return style;
    }

    /** Header xám in nghiêng - cột biến thể chỉ xem */
    public static CellStyle variantHeaderStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        font.setItalic(true);
        font.setColor(IndexedColors.GREY_50_PERCENT.getIndex());
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setLocked(true);
        return style;
    }

    /** Style cho ô dữ liệu có thể chỉnh sửa (cột sản phẩm) */
    public static CellStyle unlockedStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        style.setLocked(false);
        return style;
    }

    /** Style xám bị khóa cho vùng biến thể CHỈ XEM */
    public static CellStyle lockedGrayStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setLocked(true);
        return style;
    }
}
