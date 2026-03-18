package fpt.teddypet.application.service.products;

import fpt.teddypet.application.dto.request.products.product.ProductRequest;
import fpt.teddypet.application.dto.request.products.image.ProductImageItemRequest;
import fpt.teddypet.application.dto.request.products.variant.ProductVariantRequest;
import fpt.teddypet.application.dto.response.product.product.ProductResponse;
import fpt.teddypet.application.dto.response.product.variant.ProductVariantResponse;
import fpt.teddypet.application.port.input.products.ProductExcelService;
import fpt.teddypet.application.port.input.products.ProductService;
import fpt.teddypet.application.util.SlugUtil;
import fpt.teddypet.domain.entity.Product;
import fpt.teddypet.domain.entity.ProductBrand;
import fpt.teddypet.domain.entity.ProductCategory;
import fpt.teddypet.domain.entity.ProductAttribute;
import fpt.teddypet.domain.entity.ProductAttributeValue;
import fpt.teddypet.domain.enums.PetTypeEnum;
import fpt.teddypet.domain.enums.ProductStatusEnum;
import fpt.teddypet.domain.enums.ProductTypeEnum;
import fpt.teddypet.domain.enums.UnitEnum;
import fpt.teddypet.application.mapper.products.ProductMapper;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddressList;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.*;
import java.util.regex.Pattern;

import fpt.teddypet.infrastructure.persistence.postgres.repository.products.ProductBrandRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.products.ProductCategoryRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.products.ProductRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.products.ProductTagRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.products.ProductImageRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.products.ProductAttributeRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.products.ProductAttributeValueRepository;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductExcelApplicationService implements ProductExcelService {

    private final ProductService productService;
    private final ProductBrandRepository brandRepository;
    private final ProductCategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final ProductTagRepository tagRepository;
    private final ProductImageRepository productImageRepository;
    private final ProductAttributeRepository productAttributeRepository;
    private final ProductAttributeValueRepository productAttributeValueRepository;
    private final ProductMapper productMapper;
    private final ObjectMapper objectMapper;

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════════

    @Override
    @Transactional(readOnly = true)
    public void exportProductsToExcel(HttpServletResponse response) {
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader("Content-Disposition", "attachment; filename=products_export.xlsx");

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            XSSFSheet sheet = workbook.createSheet("Products");
            createHeaderRow(workbook, sheet);

            int rowIdx = 1;
            List<Product> products = productRepository.findAll();

            for (Product entity : products) {
                if (entity == null || entity.isDeleted())
                    continue;

                ProductResponse p = productMapper.toResponse(entity);

                // Initialize lazy collections inside transaction
                String petTypesStr = "";
                if (entity.getPetTypes() != null && !entity.getPetTypes().isEmpty()) {
                    petTypesStr = entity.getPetTypes().stream()
                            .map(Enum::name)
                            .collect(java.util.stream.Collectors.joining(", "));
                }

                if (p.variants() == null || p.variants().isEmpty()) {
                    Row row = fillDataRow(sheet, rowIdx++, p, null);
                    fillBackupFieldsForEntity(row, entity, petTypesStr);
                } else {
                    for (ProductVariantResponse v : p.variants()) {
                        Row row = fillDataRow(sheet, rowIdx++, p, v);
                        fillBackupFieldsForEntity(row, entity, petTypesStr);
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

    private void fillBackupFieldsForEntity(Row row, Product entity, String petTypesStr) {
        if (entity == null || row == null)
            return;
        // Barcode
        row.getCell(ProductExcelColumn.BARCODE.getIndex()).setCellValue(
                entity.getBarcode() != null ? entity.getBarcode() : "");
        // Description
        row.getCell(ProductExcelColumn.DESCRIPTION.getIndex()).setCellValue(
                entity.getDescription() != null ? entity.getDescription() : "");
        // PetTypes
        row.getCell(ProductExcelColumn.PET_TYPES.getIndex()).setCellValue(petTypesStr);
    }

    @Override
    @Transactional(readOnly = true)
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
    @Transactional
    public ImportResult importProductsFromExcel(MultipartFile file, String duplicateResolutionsJson) {
        if (file.isEmpty())
            throw new IllegalArgumentException("File trống, vui lòng chọn file hợp lệ.");

        Map<Integer, String> dupResolutions = parseDuplicateResolutions(duplicateResolutionsJson);
        int created = 0, updated = 0, skipped = 0;
        List<String> errors = new ArrayList<>();

        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            Map<String, Integer> headerMap = buildHeaderIndexMap(sheet);
            Map<Long, ProductRequestDetails> toUpdate = new LinkedHashMap<>();
            List<ProductRequestDetails> toCreate = new ArrayList<>();

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null || isRowEmpty(row))
                    continue;

                int excelRow = i + 1;
                Long productId = getLongValue(getCell(row, headerMap, ProductExcelColumn.PRODUCT_ID));
                ProductRequestDetails rowDt = parseProduct(row, headerMap);

                if (productId != null) {
                    if (!productRepository.existsById(productId)) {
                        log.warn("Dòng {}: ID sản phẩm {} không tồn tại → sẽ tạo mới (ignore ID).", excelRow, productId);
                        toCreate.add(rowDt);
                        continue;
                    }
                    String excelName = getStringValue(getCell(row, headerMap, ProductExcelColumn.NAME));
                    if (StringUtils.hasText(excelName)) {
                        Product dbById = productRepository.findById(productId).orElse(null);
                        if (dbById != null && !namesMatchForImport(excelName, dbById.getName())) {
                            if (!"OVERWRITE".equalsIgnoreCase(dupResolutions.getOrDefault(excelRow, "CREATE_NEW"))) {
                                log.info("Dòng {}: PRODUCT_ID={} trỏ SP \"{}\" nhưng file là \"{}\" → tạo mới (tránh ghi đè nhầm).",
                                        excelRow, productId, dbById.getName(), excelName);
                                toCreate.add(rowDt);
                                continue;
                            }
                        }
                    }
                    ProductRequestDetails target = toUpdate.computeIfAbsent(productId, id -> initFromExistingProduct(id));
                    mergeRowInto(target, rowDt);
                } else {
                    String name = getStringValue(getCell(row, headerMap, ProductExcelColumn.NAME));
                    if (!StringUtils.hasText(name)) {
                        skipped++;
                        continue;
                    }

                    String barcode = getStringValue(getCell(row, headerMap, ProductExcelColumn.BARCODE));
                    MatchResult match = resolveExistingProductMatch(barcode, name.trim());
                    Long existingId = match != null ? match.productId() : null;

                    if (existingId != null) {
                        Product existing = productRepository.findById(existingId).orElse(null);
                        boolean sameName = existing != null && namesMatchForImport(name, existing.getName());
                        if (!sameName && !"OVERWRITE".equalsIgnoreCase(dupResolutions.getOrDefault(excelRow, "CREATE_NEW"))) {
                            existingId = null;
                        }
                    }

                    if (existingId != null) {
                        ProductRequestDetails target = toUpdate.computeIfAbsent(existingId, id -> initFromExistingProduct(id));
                        mergeRowInto(target, rowDt);
                    } else {
                        ProductRequestDetails target = toCreate.stream().filter(p -> name.equalsIgnoreCase(p.name)).findFirst().orElse(null);
                        if (target == null) {
                            toCreate.add(rowDt);
                        } else {
                            mergeRowInto(target, rowDt);
                        }
                    }
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
                    String msg = String.format("Lỗi tạo SP \"%s\": %s", prd.name, e.getMessage());
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

    @Override
    @Transactional(readOnly = true)
    public ImportPreview previewImport(MultipartFile file) {
        if (file.isEmpty()) throw new IllegalArgumentException("File trống, vui lòng chọn file hợp lệ.");

        Set<String> brandNames = new LinkedHashSet<>();
        Set<String> categoryNames = new LinkedHashSet<>();
        Set<String> tagNames = new LinkedHashSet<>();
        List<ProductExcelService.DuplicateRowPreview> duplicateRows = new ArrayList<>();

        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            Map<String, Integer> headerMap = buildHeaderIndexMap(sheet);
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null || isRowEmpty(row)) continue;
                int excelRow = i + 1;

                String brandName = getStringValue(getCell(row, headerMap, ProductExcelColumn.BRAND));
                if (StringUtils.hasText(brandName)) brandNames.add(brandName.trim());

                String catNames = getStringValue(getCell(row, headerMap, ProductExcelColumn.CATEGORIES));
                if (StringUtils.hasText(catNames)) {
                    for (String c : catNames.split(",")) {
                        if (StringUtils.hasText(c)) categoryNames.add(c.trim());
                    }
                }

                String tags = getStringValue(getCell(row, headerMap, ProductExcelColumn.TAGS));
                if (StringUtils.hasText(tags)) {
                    for (String t : tags.split(",")) {
                        if (StringUtils.hasText(t)) tagNames.add(t.trim());
                    }
                }

                Long productId = getLongValue(getCell(row, headerMap, ProductExcelColumn.PRODUCT_ID));
                String name = getStringValue(getCell(row, headerMap, ProductExcelColumn.NAME));

                // Có PRODUCT_ID nhưng tên file ≠ tên SP trong DB → nguy cơ ghi đè nhầm (file export hay giữ ID cũ).
                if (productId != null && productRepository.existsById(productId) && StringUtils.hasText(name)) {
                    productRepository.findById(productId).ifPresent(p -> {
                        if (!namesMatchForImport(name, p.getName())) {
                            duplicateRows.add(new ProductExcelService.DuplicateRowPreview(
                                    excelRow,
                                    name.trim(),
                                    "",
                                    "PRODUCT_ID",
                                    productId,
                                    p.getName() != null ? p.getName() : ""));
                        }
                    });
                }

                if (productId != null) continue;

                if (!StringUtils.hasText(name)) continue;
                String barcode = getStringValue(getCell(row, headerMap, ProductExcelColumn.BARCODE));
                MatchResult match = resolveExistingProductMatch(barcode, name.trim());
                if (match == null) continue;
                productRepository.findById(match.productId()).ifPresent(p -> {
                    if (!namesMatchForImport(name, p.getName())) {
                        duplicateRows.add(new ProductExcelService.DuplicateRowPreview(
                                excelRow,
                                name.trim(),
                                StringUtils.hasText(barcode) ? barcode.trim() : "",
                                match.source(),
                                match.productId(),
                                p.getName() != null ? p.getName() : ""));
                    }
                });
            }
        } catch (Exception e) {
            throw new RuntimeException("Không thể đọc file Excel để preview: " + e.getMessage(), e);
        }

        List<String> missingBrands = brandNames.stream()
                .filter(n -> brandRepository.findByNameIgnoreCase(n).isEmpty())
                .toList();
        List<String> missingCategories = categoryNames.stream()
                .filter(n -> categoryRepository.findByNameIgnoreCase(n).isEmpty())
                .toList();

        List<String> missingTags = tagNames.stream()
                .filter(n -> tagRepository.findByNameIgnoreCase(n).isEmpty())
                .toList();

        List<String> missingAttributes = List.of();

        return new ImportPreview(missingBrands, missingCategories, missingTags, missingAttributes, duplicateRows);
    }

    private record MatchResult(long productId, String source) {}

    private MatchResult resolveExistingProductMatch(String barcode, String name) {
        if (StringUtils.hasText(barcode)) {
            Long id = productRepository.findByBarcodeAndIsActiveTrueAndIsDeletedFalse(barcode.trim())
                    .map(Product::getId).orElse(null);
            if (id != null) return new MatchResult(id, "BARCODE");
        }
        String slug = SlugUtil.toSlug(name);
        Long id = productRepository.findBySlugAndIsActiveTrueAndIsDeletedFalse(slug)
                .map(Product::getId).orElse(null);
        if (id != null) return new MatchResult(id, "SLUG");
        return null;
    }

    private static boolean namesMatchForImport(String excelName, String dbName) {
        if (excelName == null || dbName == null) return false;
        return excelName.trim().equalsIgnoreCase(dbName.trim());
    }

    private Map<Integer, String> parseDuplicateResolutions(String json) {
        if (!StringUtils.hasText(json)) return Collections.emptyMap();
        try {
            JsonNode root = objectMapper.readTree(json);
            if (!root.isArray()) return Collections.emptyMap();
            Map<Integer, String> map = new HashMap<>();
            for (JsonNode n : root) {
                int row = n.path("rowNumber").asInt(0);
                String dec = n.path("decision").asText("CREATE_NEW").trim().toUpperCase();
                if (row > 0) {
                    map.put(row, "OVERWRITE".equals(dec) ? "OVERWRITE" : "CREATE_NEW");
                }
            }
            return map;
        } catch (Exception e) {
            log.warn("Không đọc được duplicateResolutions: {}", e.getMessage());
            return Collections.emptyMap();
        }
    }

    @Override
    @Transactional
    public ConfirmCreateResult confirmCreateMissing(ImportPreview preview) {
        if (preview == null) return new ConfirmCreateResult(0, 0, 0, 0);
        int createdBrands = 0;
        int createdCategories = 0;
        int createdTags = 0;

        if (preview.missingBrands() != null) {
            for (String b : preview.missingBrands()) {
                Long id = getOrCreateBrandIdByName(b);
                if (id != null) createdBrands++;
            }
        }

        if (preview.missingCategories() != null) {
            for (String c : preview.missingCategories()) {
                Long id = getOrCreateCategoryIdByName(c);
                if (id != null) createdCategories++;
            }
        }

        if (preview.missingTags() != null) {
            for (String t : preview.missingTags()) {
                Long id = getOrCreateTagIdByName(t);
                if (id != null) createdTags++;
            }
        }

        return new ConfirmCreateResult(createdBrands, createdCategories, createdTags, 0);
    }

    private Long getOrCreateTagIdByName(String tagName) {
        if (!StringUtils.hasText(tagName)) return null;
        String normalized = tagName.trim();
        return tagRepository.findByNameIgnoreCase(normalized)
                .map(fpt.teddypet.domain.entity.ProductTag::getId)
                .orElseGet(() -> {
                    String slugBase = SlugUtil.toSlug(normalized);
                    String slug = slugBase;
                    int suffix = 1;
                    while (tagRepository.existsBySlug(slug)) {
                        slug = slugBase + "-" + suffix++;
                    }
                    fpt.teddypet.domain.entity.ProductTag created = tagRepository.save(
                            fpt.teddypet.domain.entity.ProductTag.builder()
                                    .name(normalized)
                                    .slug(slug)
                                    .description(null)
                                    .color(null)
                                    .isActive(true)
                                    .isDeleted(false)
                                    .build());
                    log.info("Auto-created missing tag '{}' (id={}) during Excel import.", normalized, created.getId());
                    return created.getId();
                });
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
    private Row fillDataRow(Sheet sheet, int rowIndex, ProductResponse p, ProductVariantResponse v) {
        Row row = sheet.createRow(rowIndex);
        for (ProductExcelColumn col : ProductExcelColumn.values()) {
            row.createCell(col.getIndex()).setCellValue(col.getDataExtractor().apply(p, v));
        }
        return row;
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
            String value;
            if (col == ProductExcelColumn.SLUG) {
                value = "";
            } else if (col.isReadOnly()) {
                value = col == ProductExcelColumn.VARIANT_ID
                        ? "(Chỉ xem - Quản lý biến thể trên web)"
                        : "";
            } else {
                value = samples.getOrDefault(col, "");
            }
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
                "• Để TRỐNG = thêm mới (hoặc khớp barcode/slug)\n" +
                        "• Có ID + cột TÊN phải TRÙNG tên SP trên hệ thống → mới cập nhật đúng SP đó\n" +
                        "• ID đúng nhưng TÊN khác → mặc định TẠO MỚI (tránh ghi đè nhầm); chọn Ghi đè trong wizard nếu cố ý đổi tên\n" +
                        "• ID không tồn tại → tạo mới");

        addTooltip(sheet, helper, ProductExcelColumn.SLUG.getIndex(),
                "🔒 Slug — chỉ xem",
                "Cột này bị khóa. Slug do hệ thống tự sinh từ tên sản phẩm.\n" +
                        "Khi xuất Excel bạn sẽ thấy slug hiện tại để đối chiếu; không nhập/sửa khi import.");

        // Tooltip cho VARIANT_ID (chỉ xem, không dùng khi import)
        addTooltip(sheet, helper, ProductExcelColumn.VARIANT_ID.getIndex(),
                "📋 VARIANT_ID chỉ xem",
                "Không cần nhập VARIANT_ID khi import.\n" +
                        "Nếu bạn nhập/copy từ export, hệ thống sẽ BỎ QUA cột này.");

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

    private static class ProductRequestDetails {
        String name;
        String barcode;
        String status;
        String desc;
        Long brandId;
        List<Long> categoryIds = new ArrayList<>();
        List<Long> tagIds = new ArrayList<>();
        List<PetTypeEnum> petTypes = new ArrayList<>();
        List<ProductImageItemRequest> images = new ArrayList<>();
        List<ProductVariantRequest> variants = new ArrayList<>();
    }

    private Long getOrCreateBrandIdByName(String brandName) {
        if (!StringUtils.hasText(brandName)) return null;
        String normalized = brandName.trim();
        return brandRepository.findByNameIgnoreCase(normalized)
                .map(ProductBrand::getId)
                .orElseGet(() -> {
                    // Auto-create brand when missing (Excel import mapping)
                    String slugBase = SlugUtil.toSlug(normalized);
                    String slug = slugBase;
                    int suffix = 1;
                    while (brandRepository.existsBySlug(slug)) {
                        slug = slugBase + "-" + suffix++;
                    }
                    ProductBrand created = brandRepository.save(ProductBrand.builder()
                            .name(normalized)
                            .slug(slug)
                            .description(null)
                            .logoUrl(null)
                            .altImage(null)
                            .websiteUrl(null)
                            .isActive(true)
                            .isDeleted(false)
                            .build());
                    log.info("Auto-created missing brand '{}' (id={}) during Excel import.", normalized, created.getId());
                    return created.getId();
                });
    }

    private Long getOrCreateCategoryIdByName(String categoryName) {
        if (!StringUtils.hasText(categoryName)) return null;
        String normalized = categoryName.trim();
        return categoryRepository.findByNameIgnoreCase(normalized)
                .map(ProductCategory::getId)
                .orElseGet(() -> {
                    // Auto-create category as root (no parent). Type/pet-types can be adjusted later on web.
                    String slugBase = SlugUtil.toSlug(normalized);
                    String slug = slugBase;
                    int suffix = 1;
                    while (categoryRepository.existsBySlug(slug)) {
                        slug = slugBase + "-" + suffix++;
                    }
                    ProductCategory created = categoryRepository.save(ProductCategory.builder()
                            .name(normalized)
                            .slug(slug)
                            .description(null)
                            .imageUrl(null)
                            .altImage(null)
                            .categoryType(null)
                            .suitablePetTypes(null)
                            .parent(null)
                            .isActive(true)
                            .isDeleted(false)
                            .build());
                    log.info("Auto-created missing category '{}' (id={}) during Excel import.", normalized, created.getId());
                    return created.getId();
                });
    }

    private ProductRequestDetails parseProduct(Row row, Map<String, Integer> headerMap) {
        ProductRequestDetails dt = new ProductRequestDetails();
        dt.name = getStringValue(getCell(row, headerMap, ProductExcelColumn.NAME));
        dt.barcode = getStringValue(getCell(row, headerMap, ProductExcelColumn.BARCODE));
        dt.status = getStringValue(getCell(row, headerMap, ProductExcelColumn.STATUS));
        dt.desc = getStringValue(getCell(row, headerMap, ProductExcelColumn.DESCRIPTION));

        String brandName = getStringValue(getCell(row, headerMap, ProductExcelColumn.BRAND));
        dt.brandId = getOrCreateBrandIdByName(brandName);

        String catNames = getStringValue(getCell(row, headerMap, ProductExcelColumn.CATEGORIES));
        if (StringUtils.hasText(catNames)) {
            for (String cName : catNames.split(",")) {
                Long catId = getOrCreateCategoryIdByName(cName);
                if (catId != null) dt.categoryIds.add(catId);
            }
        }

        // Tags
        String tagNames = getStringValue(getCell(row, headerMap, ProductExcelColumn.TAGS));
        if (StringUtils.hasText(tagNames)) {
            for (String tName : tagNames.split(",")) {
                Long tagId = getOrCreateTagIdByName(tName);
                if (tagId != null) dt.tagIds.add(tagId);
            }
        }

        String petStr = getStringValue(getCell(row, headerMap, ProductExcelColumn.PET_TYPES));
        if (StringUtils.hasText(petStr)) {
            for (String pt : petStr.split(",")) {
                try {
                    dt.petTypes.add(PetTypeEnum.valueOf(pt.trim().toUpperCase()));
                } catch (Exception ignored) {
                }
            }
        }

        // Product images (comma-separated URLs)
        String imgUrls = getStringValue(getCell(row, headerMap, ProductExcelColumn.PRODUCT_IMAGE_URLS));
        if (StringUtils.hasText(imgUrls)) {
            int order = 0;
            for (String u : imgUrls.split(",")) {
                String url = u.trim();
                if (!url.isEmpty()) {
                    dt.images.add(new ProductImageItemRequest(null, url, null, order++));
                }
            }
        }

        // Variant per row (optional). If price/stock/unit provided, treat row as a variant line.
        ProductVariantRequest variant = parseVariant(row, headerMap);
        if (variant != null) {
            dt.variants.add(variant);
        }

        return dt;
    }

    private ProductVariantRequest parseVariant(Row row, Map<String, Integer> headerMap) {
        String priceStr = getStringValue(getCell(row, headerMap, ProductExcelColumn.VARIANT_PRICE));
        String stockStr = getStringValue(getCell(row, headerMap, ProductExcelColumn.VARIANT_STOCK));
        String unitStr = getStringValue(getCell(row, headerMap, ProductExcelColumn.VARIANT_UNIT));

        if (!StringUtils.hasText(priceStr) && !StringUtils.hasText(stockStr) && !StringUtils.hasText(unitStr)) {
            return null;
        }

        BigDecimal price = parseBigDecimal(priceStr);
        BigDecimal salePrice = parseBigDecimal(getStringValue(getCell(row, headerMap, ProductExcelColumn.VARIANT_SALE_PRICE)));
        Integer stock = parseInteger(stockStr);
        UnitEnum unit = parseUnit(unitStr);
        Integer weight = parseInteger(getStringValue(getCell(row, headerMap, ProductExcelColumn.VARIANT_WEIGHT)));
        String name = getStringValue(getCell(row, headerMap, ProductExcelColumn.VARIANT_NAME));
        String featuredImageUrl = getStringValue(getCell(row, headerMap, ProductExcelColumn.VARIANT_FEATURED_IMAGE_URL));

        List<Long> attributeValueIds = parseAttributeValueIds(getStringValue(getCell(row, headerMap, ProductExcelColumn.VARIANT_ATTRIBUTES)));

        // variantId is ignored from Excel import to ensure overwrite behavior (delete missing, recreate)
        return new ProductVariantRequest(
                null,
                null,
                weight,
                null, null, null,
                price != null ? price : BigDecimal.ONE,
                salePrice,
                stock != null ? stock : 0,
                unit != null ? unit : UnitEnum.PIECE,
                null,
                name,
                StringUtils.hasText(featuredImageUrl) ? featuredImageUrl : null,
                null,
                attributeValueIds
        );
    }

    private List<Long> parseAttributeValueIds(String raw) {
        if (!StringUtils.hasText(raw)) return List.of();
        List<Long> ids = new ArrayList<>();
        // Format: "Kích cỡ:S, Màu:Đỏ"
        for (String part : raw.split(",")) {
            String p = part.trim();
            if (p.isEmpty()) continue;
            String[] kv = p.split(":", 2);
            if (kv.length != 2) continue;
            String attrName = kv[0].trim();
            String value = kv[1].trim();
            if (!StringUtils.hasText(attrName) || !StringUtils.hasText(value)) continue;
            Long id = getOrCreateAttributeValueId(attrName, value);
            if (id != null) ids.add(id);
        }
        return ids;
    }

    private Long getOrCreateAttributeValueId(String attributeName, String value) {
        ProductAttribute attribute = productAttributeRepository.findByNameIgnoreCaseAndIsDeletedFalse(attributeName.trim())
                .orElseGet(() -> {
                    ProductAttribute created = productAttributeRepository.save(ProductAttribute.builder()
                            .name(attributeName.trim())
                            .displayType(fpt.teddypet.domain.enums.AttributeDisplayType.TEXT)
                            .supportedUnits(new ArrayList<>())
                            .values(new ArrayList<>())
                            .displayOrder(0)
                            .build());
                    log.info("Auto-created missing attribute '{}' (attributeId={}) during Product Excel import.", created.getName(), created.getAttributeId());
                    return created;
                });

        Optional<ProductAttributeValue> existingVal = productAttributeValueRepository.findByAttributeAndValue(attribute, value.trim());
        if (existingVal.isPresent()) return existingVal.get().getValueId();

        ProductAttributeValue createdVal = productAttributeValueRepository.save(ProductAttributeValue.builder()
                .attribute(attribute)
                .value(value.trim())
                .displayOrder(0)
                .displayCode(null)
                .measurement(null)
                .build());
        return createdVal.getValueId();
    }

    private ProductRequest mapToRequest(ProductRequestDetails dt) {
        // Mặc định DRAFT - sản phẩm import từ Excel cần được review trên web trước khi
        // publish
        ProductStatusEnum status = ProductStatusEnum.DRAFT;
        try {
            if (StringUtils.hasText(dt.status))
                status = ProductStatusEnum.valueOf(dt.status.toUpperCase());
        } catch (Exception ignored) {
            // Nếu giá trị STATUS không hợp lệ → giữ DRAFT
        }

        // Infer productType + attributeIds from variants' attributeValueIds
        Set<Long> valueIds = new LinkedHashSet<>();
        for (ProductVariantRequest v : dt.variants) {
            if (v != null && v.attributeValueIds() != null) valueIds.addAll(v.attributeValueIds());
        }
        List<Long> attributeIds = new ArrayList<>();
        if (!valueIds.isEmpty()) {
            List<ProductAttributeValue> values = productAttributeValueRepository.findByValueIdInAndIsDeletedFalse(valueIds);
            attributeIds = values.stream()
                    .map(v -> v.getAttribute() != null ? v.getAttribute().getAttributeId() : null)
                    .filter(Objects::nonNull)
                    .distinct()
                    .toList();
        }
        ProductTypeEnum productType = !attributeIds.isEmpty() ? ProductTypeEnum.VARIABLE : ProductTypeEnum.SIMPLE;

        return new ProductRequest(
                dt.name, dt.barcode, null, dt.desc, null, null,
                null, null, null, null,
                dt.petTypes,
                dt.brandId,
                status,
                productType,
                dt.categoryIds,
                dt.tagIds, null, attributeIds,
                dt.images,
                dt.variants);
    }

    private void mergeRowInto(ProductRequestDetails target, ProductRequestDetails rowDt) {
        if (target == null || rowDt == null) return;
        if (!StringUtils.hasText(target.name) && StringUtils.hasText(rowDt.name)) target.name = rowDt.name;
        if (!StringUtils.hasText(target.barcode) && StringUtils.hasText(rowDt.barcode)) target.barcode = rowDt.barcode;
        if (!StringUtils.hasText(target.status) && StringUtils.hasText(rowDt.status)) target.status = rowDt.status;
        if (!StringUtils.hasText(target.desc) && StringUtils.hasText(rowDt.desc)) target.desc = rowDt.desc;
        if (target.brandId == null && rowDt.brandId != null) target.brandId = rowDt.brandId;
        if (target.categoryIds.isEmpty() && rowDt.categoryIds != null) target.categoryIds.addAll(rowDt.categoryIds);
        if (target.tagIds.isEmpty() && rowDt.tagIds != null) target.tagIds.addAll(rowDt.tagIds);
        if (target.petTypes.isEmpty() && rowDt.petTypes != null) target.petTypes.addAll(rowDt.petTypes);
        // Images: if Excel row provides images -> replace; otherwise keep existing
        if (rowDt.images != null && !rowDt.images.isEmpty()) {
            target.images.clear();
            target.images.addAll(rowDt.images);
        }
        if (rowDt.variants != null && !rowDt.variants.isEmpty()) target.variants.addAll(rowDt.variants);
    }

    private ProductRequestDetails initFromExistingProduct(Long productId) {
        ProductRequestDetails dt = new ProductRequestDetails();
        if (productId == null) return dt;
        try {
            // Preload existing images so Excel import does not wipe them out
            List<fpt.teddypet.domain.entity.ProductImage> imgs =
                    productImageRepository.findByProductIdAndIsDeletedFalseOrderByDisplayOrderAsc(productId);
            for (fpt.teddypet.domain.entity.ProductImage img : imgs) {
                dt.images.add(new ProductImageItemRequest(
                        img.getId(),
                        img.getImageUrl(),
                        img.getAltText(),
                        img.getDisplayOrder()
                ));
            }
        } catch (Exception ignored) {
        }
        return dt;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CELL READ HELPERS
    // ═══════════════════════════════════════════════════════════════════════

    private boolean isRowEmpty(Row row) {
        // Empty row check should be header-aware; but we can keep simple: if first cell null -> empty.
        return row.getCell(0) == null;
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

    private BigDecimal parseBigDecimal(String raw) {
        if (!StringUtils.hasText(raw)) return null;
        try {
            return new BigDecimal(raw.trim().replace(",", ""));
        } catch (Exception e) {
            return null;
        }
    }

    private Integer parseInteger(String raw) {
        if (!StringUtils.hasText(raw)) return null;
        try {
            return Integer.parseInt(raw.trim());
        } catch (Exception e) {
            return null;
        }
    }

    private UnitEnum parseUnit(String raw) {
        if (!StringUtils.hasText(raw)) return null;
        try {
            return UnitEnum.valueOf(raw.trim().toUpperCase());
        } catch (Exception e) {
            return null;
        }
    }

    private static final Pattern NON_ALNUM = Pattern.compile("[^a-z0-9]+");

    private Map<String, Integer> buildHeaderIndexMap(Sheet sheet) {
        Map<String, Integer> map = new HashMap<>();
        if (sheet == null) return map;
        Row header = sheet.getRow(0);
        if (header == null) return map;
        for (int i = 0; i < header.getLastCellNum(); i++) {
            Cell c = header.getCell(i);
            if (c == null) continue;
            String raw = "";
            try { raw = c.getStringCellValue(); } catch (Exception ignored) {}
            String key = normalizeHeader(raw);
            if (!key.isEmpty()) map.putIfAbsent(key, i);
        }
        return map;
    }

    private Cell getCell(Row row, Map<String, Integer> headerMap, ProductExcelColumn col) {
        if (row == null) return null;
        // Prefer matching by header text to support old/new exports even if indices shift
        Integer idx = headerMap.get(normalizeHeader(col.getHeader()));
        if (idx != null) return row.getCell(idx);

        // Backward-compat: old exports had "[CHỈ XEM]" prefix for variant columns
        String altHeader = col.getHeader().replace("[CHỈ XEM]", "").trim();
        idx = headerMap.get(normalizeHeader(altHeader));
        if (idx != null) return row.getCell(idx);

        // Fallback to enum index (works when layout matches current template)
        return row.getCell(col.getIndex());
    }

    private String normalizeHeader(String s) {
        if (s == null) return "";
        String lower = s.trim().toLowerCase(Locale.ROOT);
        lower = lower.replace("đ", "d");
        return NON_ALNUM.matcher(lower).replaceAll("");
    }
}
