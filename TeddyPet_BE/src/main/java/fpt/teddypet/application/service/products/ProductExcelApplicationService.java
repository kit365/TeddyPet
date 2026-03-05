package fpt.teddypet.application.service.products;

import fpt.teddypet.application.dto.request.products.product.ProductRequest;
import fpt.teddypet.application.dto.response.product.product.ProductResponse;
import fpt.teddypet.application.dto.response.product.variant.ProductVariantResponse;
import fpt.teddypet.application.port.input.products.ProductExcelService;
import fpt.teddypet.application.port.input.products.ProductService;
import fpt.teddypet.domain.entity.Product;
import fpt.teddypet.domain.enums.PetTypeEnum;
import fpt.teddypet.domain.enums.ProductStatusEnum;
import fpt.teddypet.domain.enums.ProductTypeEnum;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddressList;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;

import fpt.teddypet.infrastructure.persistence.postgres.repository.products.ProductBrandRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.products.ProductCategoryRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.products.ProductRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.products.ProductTagRepository;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductExcelApplicationService implements ProductExcelService {

    private final ProductService productService;
    private final ProductBrandRepository brandRepository;
    private final ProductCategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final ProductTagRepository tagRepository;

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════════

    @Override
    public void exportProductsToExcel(HttpServletResponse response) {
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader("Content-Disposition", "attachment; filename=products_export.xlsx");

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            XSSFSheet sheet = workbook.createSheet("Products");
            createHeaderRow(workbook, sheet);

            int rowIdx = 1;
            for (ProductResponse p : productService.getAll()) {
                // Fetch full detail for backup-complete export (description, barcode, petTypes)
                var detail = productService.getDetail(p.productId());

                if (p.variants() == null || p.variants().isEmpty()) {
                    fillDataRow(sheet, rowIdx, p, null);
                    // Fill backup fields from detail on the first row
                    fillBackupFields(sheet.getRow(rowIdx), detail);
                    rowIdx++;
                } else {
                    boolean first = true;
                    for (ProductVariantResponse v : p.variants()) {
                        fillDataRow(sheet, rowIdx, p, v);
                        if (first) {
                            fillBackupFields(sheet.getRow(rowIdx), detail);
                            first = false;
                        }
                        rowIdx++;
                    }
                }
            }

            autoSizeColumns(sheet);
            addDataValidations(workbook, sheet);
            applySheetProtection(workbook, sheet);
            addReferenceSheet(workbook);
            workbook.write(response.getOutputStream());
        } catch (IOException e) {
            log.error("Lỗi xuất Excel: ", e);
            throw new RuntimeException("Không thể xuất file Excel.");
        }
    }

    /**
     * Fill backup fields that ProductResponse doesn't include: barcode,
     * description, petTypes
     */
    private void fillBackupFields(Row row,
            fpt.teddypet.application.dto.response.product.product.ProductDetailResponse detail) {
        if (detail == null || row == null)
            return;
        // Barcode (column index 2)
        row.getCell(ProductExcelColumn.BARCODE.getIndex()).setCellValue(
                detail.barcode() != null ? detail.barcode() : "");
        // Description (column index 4)
        row.getCell(ProductExcelColumn.DESCRIPTION.getIndex()).setCellValue(
                detail.description() != null ? detail.description() : "");
        // PetTypes - fetch from entity since detail doesn't have it
        Product entity = productService.getById(detail.id());
        if (entity != null && entity.getPetTypes() != null && !entity.getPetTypes().isEmpty()) {
            String petTypesStr = entity.getPetTypes().stream()
                    .map(Enum::name)
                    .collect(java.util.stream.Collectors.joining(", "));
            row.getCell(ProductExcelColumn.PET_TYPES.getIndex()).setCellValue(petTypesStr);
        }
    }

    @Override
    public void downloadTemplate(HttpServletResponse response) {
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader("Content-Disposition", "attachment; filename=products_template.xlsx");

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            XSSFSheet sheet = workbook.createSheet("Products");
            createHeaderRow(workbook, sheet);
            createSampleRow(sheet, 1);
            autoSizeColumns(sheet);
            addDataValidations(workbook, sheet);
            applySheetProtection(workbook, sheet);
            addReferenceSheet(workbook);
            workbook.write(response.getOutputStream());
        } catch (IOException e) {
            throw new RuntimeException("Không thể tạo template.");
        }
    }

    @Override
    public ProductExcelService.ImportResult importProductsFromExcel(MultipartFile file) {
        if (file.isEmpty())
            throw new IllegalArgumentException("File trống, vui lòng chọn file hợp lệ.");

        int created = 0, updated = 0, skipped = 0;
        List<String> errors = new ArrayList<>();

        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            Map<Long, ProductRequestDetails> toUpdate = new LinkedHashMap<>();
            List<ProductRequestDetails> toCreate = new ArrayList<>();

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null || isRowEmpty(row))
                    continue;

                Long productId = getLongValue(row.getCell(ProductExcelColumn.PRODUCT_ID.getIndex()));

                if (productId != null) {
                    // BẢO MẬT: ID phải tồn tại thật sự trong DB
                    if (!productRepository.existsById(productId)) {
                        String msg = String.format("Dòng %d: ID sản phẩm %d không tồn tại → bỏ qua.", i + 1, productId);
                        log.warn(msg);
                        errors.add(msg);
                        skipped++;
                        continue;
                    }
                    toUpdate.computeIfAbsent(productId, id -> parseProduct(row));
                } else {
                    String name = getStringValue(row.getCell(ProductExcelColumn.NAME.getIndex()));
                    if (!StringUtils.hasText(name)) {
                        skipped++;
                        continue;
                    }
                    toCreate.stream().filter(p -> p.name().equals(name)).findFirst()
                            .orElseGet(() -> {
                                ProductRequestDetails p = parseProduct(row);
                                toCreate.add(p);
                                return p;
                            });
                }
            }

            // Cập nhật sản phẩm theo ID
            for (Map.Entry<Long, ProductRequestDetails> entry : toUpdate.entrySet()) {
                Long id = entry.getKey();
                try {
                    productService.update(id, mapToRequest(entry.getValue()));
                    updated++;
                } catch (Exception e) {
                    String msg = String.format("Lỗi cập nhật SP ID %d: %s", id, e.getMessage());
                    log.error(msg);
                    errors.add(msg);
                    skipped++;
                }
            }

            // Tạo mới sản phẩm
            for (ProductRequestDetails prd : toCreate) {
                try {
                    productService.create(mapToRequest(prd));
                    created++;
                } catch (Exception e) {
                    String msg = String.format("Lỗi tạo SP \"%s\": %s", prd.name(), e.getMessage());
                    log.error(msg);
                    errors.add(msg);
                    skipped++;
                }
            }

        } catch (Exception e) {
            log.error("Lỗi đọc file Excel: ", e);
            throw new RuntimeException("Cấu trúc file không đúng hoặc có lỗi xảy ra: " + e.getMessage());
        }

        log.info("Import hoàn tất: tạo={}, cập nhật={}, bỏ qua={}, lỗi={}",
                created, updated, skipped, errors.size());
        return new ProductExcelService.ImportResult(created, updated, skipped, errors);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // EXCEL BUILDING (dựa theo ProductExcelColumn enum)
    // ═══════════════════════════════════════════════════════════════════════

    /** Tạo header, mỗi cột lấy style từ isReadOnly của enum */
    private void createHeaderRow(XSSFWorkbook workbook, Sheet sheet) {
        Row header = sheet.createRow(0);
        CellStyle productStyle = ExcelStyleHelper.productHeaderStyle(workbook);
        CellStyle variantStyle = ExcelStyleHelper.variantHeaderStyle(workbook);
        for (ProductExcelColumn col : ProductExcelColumn.values()) {
            Cell cell = header.createCell(col.getIndex());
            cell.setCellValue(col.getHeader());
            cell.setCellStyle(col.isReadOnly() ? variantStyle : productStyle);
        }
    }

    /** Điền dữ liệu: mỗi cột tự biết cách lấy data qua dataExtractor */
    private void fillDataRow(Sheet sheet, int rowIndex, ProductResponse p, ProductVariantResponse v) {
        Row row = sheet.createRow(rowIndex);
        for (ProductExcelColumn col : ProductExcelColumn.values()) {
            row.createCell(col.getIndex()).setCellValue(col.getDataExtractor().apply(p, v));
        }
    }

    /** Dòng mẫu cho template - dùng Map để chỉ khai báo cột có data */
    private void createSampleRow(Sheet sheet, int rowIndex) {
        Map<ProductExcelColumn, String> samples = Map.of(
                ProductExcelColumn.NAME, "Sản phẩm mẫu 1",
                ProductExcelColumn.BARCODE, "BC12345",
                ProductExcelColumn.STATUS, "DRAFT",
                ProductExcelColumn.DESCRIPTION, "Mô tả ngắn về sản phẩm",
                ProductExcelColumn.CATEGORIES, "Thức ăn chó",
                ProductExcelColumn.PET_TYPES, "DOG");
        Row row = sheet.createRow(rowIndex);
        for (ProductExcelColumn col : ProductExcelColumn.values()) {
            String value = col.isReadOnly()
                    ? "(Chỉ xem - Quản lý biến thể trên web)"
                    : samples.getOrDefault(col, "");
            row.createCell(col.getIndex()).setCellValue(value);
        }
    }

    private void autoSizeColumns(Sheet sheet) {
        for (ProductExcelColumn col : ProductExcelColumn.values()) {
            sheet.autoSizeColumn(col.getIndex());
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SHEET PROTECTION (dựa hoàn toàn vào ProductExcelColumn.isReadOnly)
    // ═══════════════════════════════════════════════════════════════════════

    private void applySheetProtection(XSSFWorkbook workbook, XSSFSheet sheet) {
        CellStyle unlockedStyle = ExcelStyleHelper.unlockedStyle(workbook);
        CellStyle lockedGrayStyle = ExcelStyleHelper.lockedGrayStyle(workbook);
        CellStyle variantHeaderStyle = ExcelStyleHelper.variantHeaderStyle(workbook);
        CellStyle productHeaderStyle = ExcelStyleHelper.productHeaderStyle(workbook);

        // Áp dụng column-level style dựa theo enum
        for (ProductExcelColumn col : ProductExcelColumn.values()) {
            sheet.setDefaultColumnStyle(col.getIndex(),
                    col.isReadOnly() ? lockedGrayStyle : unlockedStyle);
        }

        // Đồng bộ header row (header có style riêng, cần set lại)
        Row headerRow = sheet.getRow(0);
        if (headerRow != null) {
            for (ProductExcelColumn col : ProductExcelColumn.values()) {
                Cell cell = headerRow.getCell(col.getIndex());
                if (cell != null) {
                    cell.setCellStyle(col.isReadOnly() ? variantHeaderStyle : productHeaderStyle);
                }
            }
        }

        sheet.protectSheet(""); // Không đặt mật khẩu
        sheet.lockSelectLockedCells(false); // Vẫn cho chọn ô bị khóa
        sheet.lockSelectUnlockedCells(false); // Vẫn cho chọn ô không bị khóa
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DATA VALIDATIONS (dropdown, tooltip, hint)
    // ═══════════════════════════════════════════════════════════════════════

    private void addDataValidations(Workbook workbook, Sheet sheet) {
        DataValidationHelper helper = sheet.getDataValidationHelper();

        // Tooltip cho Product ID
        addTooltip(sheet, helper, ProductExcelColumn.PRODUCT_ID.getIndex(),
                "⚠️ QUAN TRỌNG - ID Sản Phẩm",
                "• Để TRỐNG nếu muốn THÊM MỚI sản phẩm\n" +
                        "• Giữ nguyên ID nếu muốn CẬP NHẬT sản phẩm\n" +
                        "• KHÔNG nhập ID tùy tiện - hệ thống từ chối nếu ID không tồn tại");

        // Tooltip cho toàn bộ vùng biến thể [CHỈ XEM]
        addRangeTooltip(sheet, helper,
                ProductExcelColumn.firstReadOnlyIndex(), ProductExcelColumn.lastReadOnlyIndex(),
                "📋 CỘT CHỈ XEM - Biến Thể",
                "Các cột này chỉ để THAM KHẢO khi export dữ liệu.\n\n" +
                        "Để quản lý biến thể → Vào trang Chỉnh sửa Sản Phẩm trên website.\n\n" +
                        "Dữ liệu nhập vào đây sẽ bị BỎ QUA khi import.");

        // Dropdown Trạng thái (Status)
        String[] statusList = Arrays.stream(ProductStatusEnum.values())
                .map(Enum::name).toArray(String[]::new);
        addDropdown(sheet, helper, ProductExcelColumn.STATUS.getIndex(), statusList,
                "Giá trị không hợp lệ",
                "Vui lòng chọn từ danh sách: " + String.join(", ", statusList));

        // Tooltip Loại thú cưng (không dropdown vì Excel không hỗ trợ multi-select)
        addTooltip(sheet, helper, ProductExcelColumn.PET_TYPES.getIndex(),
                "🐾 Loại Thú Cưng",
                "Nhập giá trị, cách nhau bởi dấu PHẨY (,)\n\n" +
                        "Giá trị hợp lệ:\n  DOG → Chó\n  CAT → Mèo\n  OTHER → Khác\n\n" +
                        "Ví dụ: DOG,CAT  hoặc  CAT,OTHER");

        // Dropdown Thương hiệu (từ DB, qua hidden sheet)
        List<fpt.teddypet.domain.entity.ProductBrand> brands = brandRepository.findAll();
        if (!brands.isEmpty()) {
            Sheet hiddenSheet = workbook.createSheet("HiddenBrands");
            for (int i = 0; i < brands.size(); i++) {
                hiddenSheet.createRow(i).createCell(0).setCellValue(brands.get(i).getName());
            }
            Name namedCell = workbook.createName();
            namedCell.setNameName("BrandList");
            namedCell.setRefersToFormula("HiddenBrands!$A$1:$A$" + brands.size());

            int brandCol = ProductExcelColumn.BRAND.getIndex();
            DataValidation brandValidation = helper.createValidation(
                    helper.createFormulaListConstraint("BrandList"),
                    new CellRangeAddressList(1, 5000, brandCol, brandCol));
            brandValidation.setShowErrorBox(false); // Cho phép nhập brand mới
            sheet.addValidationData(brandValidation);
            workbook.setSheetHidden(workbook.getSheetIndex("HiddenBrands"), true);
        }
    }

    // ─── Validation mini-helpers (giảm boilerplate) ───────────────────────

    private void addTooltip(Sheet sheet, DataValidationHelper helper,
            int col, String title, String message) {
        addRangeTooltip(sheet, helper, col, col, title, message);
    }

    private void addRangeTooltip(Sheet sheet, DataValidationHelper helper,
            int fromCol, int toCol, String title, String message) {
        DataValidation v = helper.createValidation(
                helper.createTextLengthConstraint(
                        DataValidationConstraint.OperatorType.GREATER_OR_EQUAL, "0", null),
                new CellRangeAddressList(1, 5000, fromCol, toCol));
        v.createPromptBox(title, message);
        v.setShowPromptBox(true);
        v.setShowErrorBox(false);
        sheet.addValidationData(v);
    }

    private void addDropdown(Sheet sheet, DataValidationHelper helper,
            int col, String[] values, String errorTitle, String errorMsg) {
        DataValidation v = helper.createValidation(
                helper.createExplicitListConstraint(values),
                new CellRangeAddressList(1, 5000, col, col));
        v.setShowErrorBox(true);
        v.createErrorBox(errorTitle, errorMsg);
        sheet.addValidationData(v);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // REFERENCE SHEET - Danh mục & Thương hiệu để người dùng tham khảo
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Tạo các sheet tham khảo riêng biệt cho từng loại dữ liệu.
     * Mỗi sheet chứa đúng 1 loại: Thương Hiệu, Danh Mục Lá, Tags.
     */
    private void addReferenceSheet(XSSFWorkbook workbook) {
        CellStyle headerStyle = ExcelStyleHelper.productHeaderStyle(workbook);

        // Sheet 1: Thương Hiệu
        createSingleColumnRefSheet(workbook, "🏆 Thương Hiệu", "Tên Thương Hiệu", headerStyle,
                brandRepository.findAll().stream()
                        .map(b -> b.getName()).sorted().toList());

        // Sheet 2: Danh Mục Lá (không có con - gán vào con → BE tự gán cha)
        createSingleColumnRefSheet(workbook, "📂 Danh Mục", "Tên Danh Mục", headerStyle,
                categoryRepository.findByChildrenIsEmptyAndIsDeletedFalse().stream()
                        .map(c -> c.getName()).sorted().toList());

        // Sheet 3: Tags
        createSingleColumnRefSheet(workbook, "🔖 Tags", "Tên Tag", headerStyle,
                tagRepository.findAll().stream()
                        .map(t -> t.getName()).sorted().toList());
    }

    private void createSingleColumnRefSheet(XSSFWorkbook workbook, String sheetName,
            String headerLabel, CellStyle headerStyle, List<String> values) {
        Sheet sheet = workbook.createSheet(sheetName);
        Row header = sheet.createRow(0);
        Cell cell = header.createCell(0);
        cell.setCellValue(headerLabel);
        cell.setCellStyle(headerStyle);

        for (int i = 0; i < values.size(); i++) {
            sheet.createRow(i + 1).createCell(0).setCellValue(values.get(i));
        }
        sheet.setColumnWidth(0, 40 * 256);

        // Đặt sau sheet Products (index 1, 2, 3)
        int targetIdx = workbook.getNumberOfSheets() - 1;
        workbook.setSheetOrder(sheetName, targetIdx);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // IMPORT PARSING
    // ═══════════════════════════════════════════════════════════════════════

    private record ProductRequestDetails(
            String name, String barcode, String status, String desc,
            Long brandId, List<Long> categoryIds, List<PetTypeEnum> petTypes,
            List<fpt.teddypet.application.dto.request.products.variant.ProductVariantRequest> variants) {
    }

    private ProductRequestDetails parseProduct(Row row) {
        String name = getStringValue(row.getCell(ProductExcelColumn.NAME.getIndex()));
        // Slug không có trong template - BE tự generate từ tên sản phẩm
        String barcode = getStringValue(row.getCell(ProductExcelColumn.BARCODE.getIndex()));
        String status = getStringValue(row.getCell(ProductExcelColumn.STATUS.getIndex()));
        String desc = getStringValue(row.getCell(ProductExcelColumn.DESCRIPTION.getIndex()));

        String brandName = getStringValue(row.getCell(ProductExcelColumn.BRAND.getIndex()));
        Long brandId = StringUtils.hasText(brandName)
                ? brandRepository.findByNameIgnoreCase(brandName).map(b -> b.getId()).orElse(null)
                : null;

        List<Long> catIds = new ArrayList<>();
        String catNames = getStringValue(row.getCell(ProductExcelColumn.CATEGORIES.getIndex()));
        if (StringUtils.hasText(catNames)) {
            for (String cName : catNames.split(",")) {
                categoryRepository.findByNameIgnoreCase(cName.trim())
                        .ifPresent(c -> catIds.add(c.getId()));
            }
        }

        List<PetTypeEnum> petTypes = new ArrayList<>();
        String petStr = getStringValue(row.getCell(ProductExcelColumn.PET_TYPES.getIndex()));
        if (StringUtils.hasText(petStr)) {
            for (String pt : petStr.split(",")) {
                try {
                    petTypes.add(PetTypeEnum.valueOf(pt.trim().toUpperCase()));
                } catch (Exception ignored) {
                }
            }
        }

        return new ProductRequestDetails(name, barcode, status, desc,
                brandId, catIds, petTypes, new ArrayList<>());
    }

    private ProductRequest mapToRequest(ProductRequestDetails dt) {
        // Mặc định DRAFT - sản phẩm import từ Excel cần được review trên web trước khi
        // publish
        ProductStatusEnum status = ProductStatusEnum.DRAFT;
        try {
            if (StringUtils.hasText(dt.status()))
                status = ProductStatusEnum.valueOf(dt.status().toUpperCase());
        } catch (Exception ignored) {
            // Nếu giá trị STATUS không hợp lệ → giữ DRAFT
        }

        return new ProductRequest(
                dt.name(), dt.barcode(), null, dt.desc(), null, null,
                null, null, null, null, dt.petTypes(), dt.brandId(), status, ProductTypeEnum.SIMPLE,
                dt.categoryIds(), null, null, null, null, dt.variants());
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CELL READ HELPERS
    // ═══════════════════════════════════════════════════════════════════════

    private boolean isRowEmpty(Row row) {
        return row.getCell(ProductExcelColumn.NAME.getIndex()) == null;
    }

    private String getStringValue(Cell cell) {
        if (cell == null)
            return "";
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue().trim();
            case NUMERIC -> {
                double num = cell.getNumericCellValue();
                yield num == (long) num ? String.valueOf((long) num) : String.valueOf(num);
            }
            default -> "";
        };
    }

    private Long getLongValue(Cell cell) {
        String val = getStringValue(cell);
        if (!StringUtils.hasText(val))
            return null;
        try {
            return Long.parseLong(val);
        } catch (Exception e) {
            return null;
        }
    }
}
