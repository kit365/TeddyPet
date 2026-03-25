package fpt.teddypet.application.service.products;

import fpt.teddypet.application.dto.request.products.attribute.ProductAttributeRequest;
import fpt.teddypet.application.dto.request.products.attribute.ProductAttributeValueItemRequest;
import fpt.teddypet.application.port.input.products.ProductAttributeService;
import fpt.teddypet.domain.enums.AttributeDisplayType;
import fpt.teddypet.domain.enums.UnitEnum;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;

/**
 * Excel import/export cho Product Attributes.
 * Mục tiêu: ổn định mapping giữa các DB (merge theo normalized name đã
 * implement ở ProductAttributeApplicationService).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ProductAttributeExcelService {

    private final ProductAttributeService productAttributeService;

    public record ImportResult(int created, int updated, int skipped, List<String> errors) {
    }

    private static final String SHEET_NAME = "ProductAttributes";

    private enum Col {
        ATTRIBUTE_ID(0, "ATTRIBUTE_ID (optional)"),
        NAME(1, "NAME *"),
        DISPLAY_TYPE(2, "DISPLAY_TYPE * (e.g. TEXT/NUMBER/COLOR)"),
        SUPPORTED_UNITS(3, "SUPPORTED_UNITS (comma-separated UnitEnum)"),
        VALUES(4, "VALUES * (semicolon-separated; example: Small;Medium;Large)");

        final int idx;
        final String header;

        Col(int idx, String header) {
            this.idx = idx;
            this.header = header;
        }
    }

    @Transactional(readOnly = true)
    public void exportToExcel(HttpServletResponse response) {
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader("Content-Disposition", "attachment; filename=product_attributes_export.xlsx");

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet(SHEET_NAME);

            CellStyle headerStyle = ExcelStyleHelper.productHeaderStyle(workbook);
            Row header = sheet.createRow(0);
            for (Col c : Col.values()) {
                Cell cell = header.createCell(c.idx);
                cell.setCellValue(c.header);
                cell.setCellStyle(headerStyle);
            }

            int r = 1;
            var attrs = productAttributeService.getAll();
            for (var a : attrs) {
                Row row = sheet.createRow(r++);
                row.createCell(Col.ATTRIBUTE_ID.idx).setCellValue(a.attributeId() != null ? a.attributeId() : 0);
                row.createCell(Col.NAME.idx).setCellValue(safe(a.name()));
                row.createCell(Col.DISPLAY_TYPE.idx)
                        .setCellValue(a.displayType() != null ? a.displayType().name() : "");
                row.createCell(Col.SUPPORTED_UNITS.idx)
                        .setCellValue(a.supportedUnits() != null
                                ? String.join(",", a.supportedUnits().stream().map(Enum::name).toList())
                                : "");
                row.createCell(Col.VALUES.idx)
                        .setCellValue(a.values() != null
                                ? String.join(";", a.values().stream().map(v -> safe(v.value())).toList())
                                : "");
            }

            for (Col c : Col.values())
                sheet.autoSizeColumn(c.idx);
            workbook.write(response.getOutputStream());
        } catch (IOException e) {
            throw new RuntimeException("Không thể export thuộc tính sản phẩm.", e);
        }
    }

    @Transactional(readOnly = true)
    public void downloadTemplate(HttpServletResponse response) {
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader("Content-Disposition", "attachment; filename=product_attributes_template.xlsx");

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet(SHEET_NAME);
            CellStyle headerStyle = ExcelStyleHelper.productHeaderStyle(workbook);
            Row header = sheet.createRow(0);
            for (Col c : Col.values()) {
                Cell cell = header.createCell(c.idx);
                cell.setCellValue(c.header);
                cell.setCellStyle(headerStyle);
            }

            Row sample = sheet.createRow(1);
            sample.createCell(Col.ATTRIBUTE_ID.idx).setCellValue("");
            sample.createCell(Col.NAME.idx).setCellValue("Trọng Lượng");
            sample.createCell(Col.DISPLAY_TYPE.idx).setCellValue("NUMBER");
            sample.createCell(Col.SUPPORTED_UNITS.idx).setCellValue("GRAM,KILOGRAM");
            sample.createCell(Col.VALUES.idx).setCellValue("100;200;500");

            for (Col c : Col.values())
                sheet.autoSizeColumn(c.idx);
            workbook.write(response.getOutputStream());
        } catch (IOException e) {
            throw new RuntimeException("Không thể tạo template thuộc tính.", e);
        }
    }

    @Transactional
    public ImportResult importFromExcel(MultipartFile file) {
        if (file.isEmpty())
            throw new IllegalArgumentException("File trống.");
        int created = 0, updated = 0, skipped = 0;
        List<String> errors = new ArrayList<>();

        try (Workbook wb = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = wb.getSheetAt(0);
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null)
                    continue;

                Long attributeId = getLong(row.getCell(Col.ATTRIBUTE_ID.idx));
                String name = getStr(row.getCell(Col.NAME.idx));
                String displayTypeStr = getStr(row.getCell(Col.DISPLAY_TYPE.idx));
                String supportedUnitsStr = getStr(row.getCell(Col.SUPPORTED_UNITS.idx));
                String valuesStr = getStr(row.getCell(Col.VALUES.idx));

                if (!StringUtils.hasText(name) || !StringUtils.hasText(displayTypeStr)) {
                    skipped++;
                    continue;
                }

                AttributeDisplayType displayType;
                try {
                    displayType = AttributeDisplayType.valueOf(displayTypeStr.trim().toUpperCase());
                } catch (Exception e) {
                    errors.add("Dòng " + (i + 1) + ": DISPLAY_TYPE không hợp lệ: " + displayTypeStr);
                    skipped++;
                    continue;
                }

                List<UnitEnum> supportedUnits = new ArrayList<>();
                if (StringUtils.hasText(supportedUnitsStr)) {
                    for (String u : supportedUnitsStr.split(",")) {
                        try {
                            supportedUnits.add(UnitEnum.valueOf(u.trim().toUpperCase()));
                        } catch (Exception ignored) {
                        }
                    }
                }

                List<ProductAttributeValueItemRequest> values = new ArrayList<>();
                if (StringUtils.hasText(valuesStr)) {
                    for (String v : valuesStr.split(";")) {
                        String vv = v.trim();
                        if (!vv.isEmpty()) {
                            values.add(new ProductAttributeValueItemRequest(null, vv, null, null, null, null));
                        }
                    }
                }
                if (values.isEmpty()) {
                    errors.add("Dòng " + (i + 1) + ": VALUES trống → bỏ qua.");
                    skipped++;
                    continue;
                }

                ProductAttributeRequest req = new ProductAttributeRequest(name.trim(), displayType, null, values,
                        supportedUnits);
                try {
                    if (attributeId != null && attributeId > 0) {
                        productAttributeService.update(attributeId, req);
                        updated++;
                    } else {
                        productAttributeService.create(req);
                        created++;
                    }
                } catch (Exception ex) {
                    errors.add("Dòng " + (i + 1) + ": " + ex.getMessage());
                    skipped++;
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Lỗi import thuộc tính: " + e.getMessage(), e);
        }

        return new ImportResult(created, updated, skipped, errors);
    }

    private static String safe(String s) {
        return s != null ? s : "";
    }

    private static String getStr(Cell cell) {
        if (cell == null)
            return "";
        try {
            if (cell.getCellType() == CellType.NUMERIC)
                return String.valueOf((long) cell.getNumericCellValue());
            return cell.getStringCellValue().trim();
        } catch (Exception e) {
            return "";
        }
    }

    private static Long getLong(Cell cell) {
        String v = getStr(cell);
        if (!StringUtils.hasText(v))
            return null;
        try {
            return Long.parseLong(v);
        } catch (Exception e) {
            return null;
        }
    }
}
