package fpt.teddypet.application.service.products;

import fpt.teddypet.domain.entity.ProductAgeRange;
import fpt.teddypet.infrastructure.persistence.postgres.repository.products.ProductAgeRangeRepository;
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
import fpt.teddypet.domain.entity.ProductTag;
import fpt.teddypet.domain.entity.ProductAttribute;
import fpt.teddypet.domain.entity.ProductAttributeValue;
import fpt.teddypet.domain.enums.PetTypeEnum;
import fpt.teddypet.domain.enums.ProductStatusEnum;
import fpt.teddypet.domain.enums.ProductTypeEnum;
import fpt.teddypet.domain.enums.UnitEnum;
import java.util.Objects;
import fpt.teddypet.application.mapper.products.ProductMapper;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddressList;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
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
    private final ProductAttributeRepository productAttributeRepository;
    private final ProductAttributeValueRepository productAttributeValueRepository;
    private final ProductAgeRangeRepository ageRangeRepository;
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
        row.getCell(ProductExcelColumn.PET_TYPES.getIndex()).setCellValue(petTypesStr != null ? petTypesStr : "");
        // Age Ranges
        if (entity.getAgeRanges() != null && !entity.getAgeRanges().isEmpty()) {
            String ageRangesStr = entity.getAgeRanges().stream()
                    .map(ProductAgeRange::getName)
                    .collect(java.util.stream.Collectors.joining(", "));
            row.getCell(ProductExcelColumn.PET_AGE.getIndex()).setCellValue(ageRangesStr);
        }
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

        int created = 0, updated = 0, skipped = 0;
        List<String> errors = new ArrayList<>();

        // Track slugs used within this batch to avoid internal collisions
        Set<String> usedSlugsInBatch = new HashSet<>();

        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            Map<String, Integer> headerMap = buildHeaderIndexMap(sheet);
            Map<Long, ProductRequestDetails> toUpdate = new LinkedHashMap<>();
            List<ProductRequestDetails> toCreate = new ArrayList<>();

            // 1. Parsing and Grouping Phase
            Map<String, ProductRequestDetails> nameToCreateMap = new LinkedHashMap<>();
            Map<Long, ProductRequestDetails> idToUpdateMap = new LinkedHashMap<>();

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null || isRowEmpty(row)) continue;

                int excelRow = i + 1;
                ProductRequestDetails rowDt = parseProduct(row, headerMap);

                if (!StringUtils.hasText(rowDt.name)) {
                    skipped++;
                    continue;
                }

                Long productIdFromCol = getLongValue(getCell(row, headerMap, ProductExcelColumn.PRODUCT_ID));
                Long existingId = null;

                // Priority 1: Check by PRODUCT_ID if provided
                if (productIdFromCol != null) {
                    if (productRepository.existsById(productIdFromCol)) {
                        existingId = productIdFromCol;
                    } else {
                        log.warn("Dòng {}: PRODUCT_ID={} không tồn tại.", excelRow, productIdFromCol);
                    }
                }

                // Priority 2: Check by Barcode
                if (existingId == null && StringUtils.hasText(rowDt.barcode)) {
                    existingId = productRepository.findByBarcodeAndIsActiveTrueAndIsDeletedFalse(rowDt.barcode.trim())
                            .map(Product::getId).orElse(null);
                }

                // Priority 3: Check by Slug (from Name)
                if (existingId == null) {
                    String slug = SlugUtil.toSlug(rowDt.name.trim());
                    existingId = productRepository.findBySlug(slug)
                            .map(Product::getId).orElse(null);
                }

                if (existingId != null) {
                    // Group under Update
                    ProductRequestDetails target = idToUpdateMap.computeIfAbsent(existingId, id -> initFromExistingProduct(id));
                    mergeRowInto(target, rowDt);
                } else {
                    // Group under Create (by Name)
                    String normalizedName = rowDt.name.trim().toLowerCase();
                    ProductRequestDetails target = nameToCreateMap.computeIfAbsent(normalizedName, k -> rowDt);
                    if (target != rowDt) {
                        mergeRowInto(target, rowDt);
                    }
                }
            }

            toCreate.addAll(nameToCreateMap.values());
            toUpdate.putAll(idToUpdateMap);

            // 2. Perform Updates
            for (Map.Entry<Long, ProductRequestDetails> entry : toUpdate.entrySet()) {
                Long id = entry.getKey();
                ProductRequestDetails prd = entry.getValue();
                try {
                    String slug = SlugUtil.toSlug(prd.name);
                    if (usedSlugsInBatch.contains(slug)) {
                        throw new RuntimeException("Tên sản phẩm bị trùng trong cùng lượt import: " + prd.name);
                    }
                    Product current = productRepository.findById(id).orElse(null);
                    if (current != null && !current.getSlug().equals(slug)) {
                        if (isSlugColliding(slug, id)) {
                            throw new RuntimeException("Tên mới bị trùng slug với sản phẩm khác trong hệ thống: " + prd.name);
                        }
                    }
                    usedSlugsInBatch.add(slug);
                    productService.update(id, mapToRequest(prd));
                    updated++;
                } catch (Exception e) {
                    String msg = String.format("Lỗi cập nhật SP ID %d: %s", id, e.getMessage());
                    log.error(msg);
                    errors.add(msg);
                    skipped++;
                }
            }

            // 3. Perform Creates
            for (ProductRequestDetails prd : toCreate) {
                try {
                    String slug = SlugUtil.toSlug(prd.name);
                    if (usedSlugsInBatch.contains(slug)) {
                        // This product was already handled in the UPDATE phase (same slug).
                        // Can happen when sibling variant rows resolved to an existing product.
                        log.info("SP \"{}\" bỏ qua tạo mới vì slug đã được xử lý trong lượt cập nhật.", prd.name);
                        skipped++;
                        continue;
                    }
                    if (isSlugColliding(slug, null)) {
                        throw new RuntimeException("Tên sản phẩm bị trùng slug với sản phẩm khác trong hệ thống: " + prd.name);
                    }
                    usedSlugsInBatch.add(slug);
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

    private boolean isSlugColliding(String slug, Long excludeId) {
        Optional<Product> existing = productRepository.findBySlugAndIsActiveTrueAndIsDeletedFalse(slug);
        if (existing.isEmpty()) return false;
        return excludeId == null || !existing.get().getId().equals(excludeId);
    }

    @Override
    @Transactional(readOnly = true)
    public ImportPreview previewImport(MultipartFile file) {
        if (file.isEmpty()) throw new IllegalArgumentException("File trống, vui lòng chọn file hợp lệ.");

        Set<String> brandNames = new LinkedHashSet<>();
        Set<String> categoryNames = new LinkedHashSet<>();
        Set<String> tagNames = new LinkedHashSet<>();
        Set<String> ageNames = new LinkedHashSet<>();
        Set<String> attributeNamesForPreview = new LinkedHashSet<>();
        List<ProductExcelService.DuplicateRowPreview> duplicateRows = new ArrayList<>();

        // In-batch duplicate detection: only flag if (slug + barcode + attributes) are all identical.
        // Otherwise, they are just variants of the same product.
        Map<String, Integer> inBatchDuplicates = new HashMap<>(); // compositeKey -> rowNumber

        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            Map<String, Integer> headerMap = buildHeaderIndexMap(sheet);
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null || isRowEmpty(row)) continue;
                int excelRow = i + 1;

                String name = getStringValue(getCell(row, headerMap, ProductExcelColumn.NAME));
                String barcode = getStringValue(getCell(row, headerMap, ProductExcelColumn.BARCODE));
                String attrs = getStringValue(getCell(row, headerMap, ProductExcelColumn.VARIANT_ATTRIBUTES));
                Long productId = getLongValue(getCell(row, headerMap, ProductExcelColumn.PRODUCT_ID));

                if (StringUtils.hasText(name)) {
                    String slug = SlugUtil.toSlug(name);
                    String compositeKey = slug + "|" + (barcode != null ? barcode.trim() : "") + "|" + (attrs != null ? attrs.trim() : "");
                    if (inBatchDuplicates.containsKey(compositeKey)) {
                        duplicateRows.add(new ProductExcelService.DuplicateRowPreview(
                            excelRow, name.trim(), barcode != null ? barcode.trim() : "",
                            "TRONG_FILE", 0L, "Dòng này bị lặp (Tên, Barcode và Thuộc tính giống hệt dòng " + inBatchDuplicates.get(compositeKey) + ")"));
                    } else {
                        inBatchDuplicates.put(compositeKey, excelRow);
                    }
                }

                // B. Detect potential new entities
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

                String ages = getStringValue(getCell(row, headerMap, ProductExcelColumn.PET_AGE));
                if (StringUtils.hasText(ages)) {
                    for (String a : ages.split(",")) {
                        if (StringUtils.hasText(a)) ageNames.add(a.trim());
                    }
                }

                if (StringUtils.hasText(attrs)) {
                    for (String part : attrs.split(",")) {
                        String[] kv = part.split(":", 2);
                        if (kv.length > 0 && StringUtils.hasText(kv[0])) {
                            attributeNamesForPreview.add(kv[0].trim());
                        }
                    }
                }

                // C. Compare with DB for external duplicates
                if (productId != null && productRepository.existsById(productId) && StringUtils.hasText(name)) {
                    productRepository.findById(productId).ifPresent(p -> {
                        if (!namesMatchForImport(name, p.getName())) {
                            duplicateRows.add(new ProductExcelService.DuplicateRowPreview(
                                    excelRow, name.trim(), "", "PRODUCT_ID", productId,
                                    p.getName() != null ? p.getName() : ""));
                        }
                    });
                } else if (productId == null && StringUtils.hasText(name)) {
                    MatchResult match = resolveExistingProductMatch(barcode, name.trim());
                    if (match != null) {
                        productRepository.findById(match.productId()).ifPresent(p -> {
                            if (!namesMatchForImport(name, p.getName())) {
                                duplicateRows.add(new ProductExcelService.DuplicateRowPreview(
                                        excelRow, name.trim(), barcode != null ? barcode.trim() : "",
                                        match.source(), match.productId(),
                                        p.getName() != null ? p.getName() : ""));
                            }
                        });
                    }
                }
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

        List<String> missingAgeRanges = ageNames.stream()
                .filter(n -> ageRangeRepository.findByName(n).isEmpty())
                .toList();

        // Detect missing attributes
        Set<String> missingAttrSet = new LinkedHashSet<>();
        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
             Sheet sheet = workbook.getSheetAt(0);
             Map<String, Integer> headerMap = buildHeaderIndexMap(sheet);
             for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                 Row row = sheet.getRow(i);
                 if (row == null || isRowEmpty(row)) continue;
                 String attrs = getStringValue(getCell(row, headerMap, ProductExcelColumn.VARIANT_ATTRIBUTES));
                 if (StringUtils.hasText(attrs)) {
                     for (String part : attrs.split(",")) {
                         String attrName = part.split(":")[0].trim();
                         if (StringUtils.hasText(attrName) && productAttributeRepository.findByNameIgnoreCaseAndIsDeletedFalse(attrName).isEmpty()) {
                             missingAttrSet.add(attrName);
                         }
                     }
                 }
             }
        } catch (Exception ignored) {}

        List<String> missingAttributes = missingAttrSet.stream().toList();

        return new ImportPreview(missingBrands, missingCategories, missingTags, missingAgeRanges, missingAttributes, duplicateRows);
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
        if (preview == null) return new ConfirmCreateResult(0, 0, 0, 0, 0);
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

        int createdAgeRanges = 0;
        if (preview.missingAgeRanges() != null) {
            for (String ar : preview.missingAgeRanges()) {
                if (ageRangeRepository.findByName(ar).isEmpty()) {
                    ageRangeRepository.save(fpt.teddypet.domain.entity.ProductAgeRange.builder()
                            .name(ar.trim())
                            .isActive(true)
                            .isDeleted(false)
                            .build());
                    createdAgeRanges++;
                    log.info("confirmCreateMissing: Created missing age range '{}'", ar);
                }
            }
        }

        int createdAttributes = 0;
        if (preview.missingAttributes() != null) {
            for (String a : preview.missingAttributes()) {
                // This will trigger the orElseGet in getOrCreateAttributeValueId logic
                // But we want to pre-create them here
                fpt.teddypet.domain.entity.ProductAttribute created = productAttributeRepository.findByNameIgnoreCaseAndIsDeletedFalse(a.trim())
                    .orElseGet(() -> productAttributeRepository.save(fpt.teddypet.domain.entity.ProductAttribute.builder()
                        .name(a.trim())
                        .displayType(fpt.teddypet.domain.enums.AttributeDisplayType.TEXT)
                        .supportedUnits(new ArrayList<>())
                        .values(new ArrayList<>())
                        .displayOrder(0)
                        .build()));
                if (created != null) createdAttributes++;
            }
        }

        return new ConfirmCreateResult(createdBrands, createdCategories, createdTags, createdAgeRanges, createdAttributes);
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

    private Long getOrCreateAgeRangeIdByName(String ageName) {
        if (!StringUtils.hasText(ageName)) return null;
        String normalized = ageName.trim();
        return ageRangeRepository.findByName(normalized)
                .map(fpt.teddypet.domain.entity.ProductAgeRange::getId)
                .orElseGet(() -> {
                    fpt.teddypet.domain.entity.ProductAgeRange created = ageRangeRepository.save(
                            fpt.teddypet.domain.entity.ProductAgeRange.builder()
                                    .name(normalized)
                                    .isActive(true)
                                    .isDeleted(false)
                                    .build());
                    log.info("Auto-created missing age range '{}' (id={}) during Excel import.", normalized, created.getId());
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

        // Prompt Excel/POI toi da ~255 ky tu (title ~32)
        addTooltip(sheet, helper, ProductExcelColumn.PRODUCT_ID.getIndex(),
                "ID san pham",
                "Trong=them moi. Co ID: Ten phai trung ten SP tren he thong moi cap nhat. Ten khac=tao moi (Import wizard: Ghi de). ID khong ton tai=tao moi.");

        addTooltip(sheet, helper, ProductExcelColumn.SLUG.getIndex(),
                "Slug (chi xem)",
                "He thong tu sinh tu ten SP. Chi de doi chieu khi xuat; import bo qua cot nay.");

        addTooltip(sheet, helper, ProductExcelColumn.VARIANT_ID.getIndex(),
                "VARIANT_ID",
                "Chi xem. Import khong dung cot nay (copy tu export cung bo qua).");

        // Dropdown Trạng thái (Status)
        String[] statusList = Arrays.stream(ProductStatusEnum.values())
                .map(Enum::name).toArray(String[]::new);
        addDropdown(sheet, helper, ProductExcelColumn.STATUS.getIndex(), statusList,
                "Giá trị không hợp lệ",
                "Vui lòng chọn từ danh sách: " + String.join(", ", statusList));

        // Tooltip Loại thú cưng (không dropdown vì Excel không hỗ trợ multi-select)
        addTooltip(sheet, helper, ProductExcelColumn.PET_TYPES.getIndex(),
                "Loai thu cung",
                "Cach nhau dau phay: DOG,CAT,OTHER. VD: DOG hoac DOG,CAT");

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

    /** Excel/POI: prompt & error text toi da 255 ky tu, title ngan hon. */
    private static final int EXCEL_DV_TEXT_MAX = 255;
    private static final int EXCEL_DV_TITLE_MAX = 32;

    private static String clampExcelDataValidationText(String s, int maxLen) {
        if (s == null) return "";
        String t = s.trim();
        if (t.length() <= maxLen) return t;
        return t.substring(0, Math.max(0, maxLen - 1)).trim() + "…";
    }

    private void addRangeTooltip(Sheet sheet, DataValidationHelper helper,
            int fromCol, int toCol, String title, String message) {
        DataValidation v = helper.createValidation(
                helper.createTextLengthConstraint(
                        DataValidationConstraint.OperatorType.GREATER_OR_EQUAL, "0", null),
                new CellRangeAddressList(1, 5000, fromCol, toCol));
        v.createPromptBox(
                clampExcelDataValidationText(title, EXCEL_DV_TITLE_MAX),
                clampExcelDataValidationText(message, EXCEL_DV_TEXT_MAX));
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
        v.createErrorBox(
                clampExcelDataValidationText(errorTitle, EXCEL_DV_TITLE_MAX),
                clampExcelDataValidationText(errorMsg, EXCEL_DV_TEXT_MAX));
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
        List<Long> ageRangeIds = new ArrayList<>();
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

        // Support hierarchical path format: "Parent > Child"
        if (normalized.contains(">")) {
            String[] parts = normalized.split(">", 2);
            String parentNameRaw = parts[0].trim();
            String childNameRaw  = parts[1].trim();

            // Resolve parent (look up only, do not create root categories here)
            ProductCategory parent = StringUtils.hasText(parentNameRaw)
                    ? categoryRepository.findByNameIgnoreCase(parentNameRaw).orElse(null)
                    : null;

            if (!StringUtils.hasText(childNameRaw)) return null;

            // Try to find child under the resolved parent first
            if (parent != null) {
                final Long parentId = parent.getId();
                List<ProductCategory> candidates = categoryRepository.findByNameIgnoreCase(childNameRaw).stream()
                        // findByNameIgnoreCase might return Optional; adapt if yours returns a list
                        .filter(c -> c.getParent() != null && c.getParent().getId().equals(parentId))
                        .toList();
                // Ideally use a method that returns List; fall back to the Optional if needed
                if (!candidates.isEmpty()) return candidates.get(0).getId();
            }

            // Fall back: look up child by name alone
            ProductCategory childByName = categoryRepository.findByNameIgnoreCase(childNameRaw).orElse(null);
            if (childByName != null) return childByName.getId();

            // Auto-create child under the resolved parent
            String slugBase = SlugUtil.toSlug(childNameRaw);
            String slug = slugBase;
            int suffix = 1;
            while (categoryRepository.existsBySlug(slug)) { slug = slugBase + "-" + suffix++; }
            ProductCategory created = categoryRepository.save(ProductCategory.builder()
                    .name(childNameRaw)
                    .slug(slug)
                    .parent(parent)   // preserves hierarchy
                    .isActive(true)
                    .isDeleted(false)
                    .build());
            log.info("Auto-created category '{}' under parent '{}' (id={})", childNameRaw, parentNameRaw, created.getId());
            return created.getId();
        }

        // Plain name (no path) — existing behaviour
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
        dt.tagIds = parseTagIds(tagNames);

        // Age Ranges
        String ageRanges = getStringValue(getCell(row, headerMap, ProductExcelColumn.PET_AGE));
        dt.ageRangeIds = parseAgeRangeIds(ageRanges);

        // PetTypes

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

    private List<Long> parseTagIds(String raw) {
        if (!StringUtils.hasText(raw)) return new ArrayList<>();
        List<Long> ids = new ArrayList<>();
        for (String tag : raw.split(",")) {
            Long id = getOrCreateTagIdByName(tag.trim());
            if (id != null) ids.add(id);
        }
        return ids;
    }

    private List<Long> parseAgeRangeIds(String raw) {
        if (!StringUtils.hasText(raw)) return new ArrayList<>();
        List<Long> ids = new ArrayList<>();
        for (String age : raw.split(",")) {
            Long id = getOrCreateAgeRangeIdByName(age.trim());
            if (id != null) ids.add(id);
        }
        return ids;
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
                dt.tagIds, dt.ageRangeIds, attributeIds,
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
        if (rowDt.ageRangeIds != null && !rowDt.ageRangeIds.isEmpty()) {
            for (Long id : rowDt.ageRangeIds) {
                if (!target.ageRangeIds.contains(id)) target.ageRangeIds.add(id);
            }
        }
    }

    private ProductRequestDetails initFromExistingProduct(Long productId) {
        ProductRequestDetails dt = new ProductRequestDetails();
        if (productId == null) return dt;
        Product p = productRepository.findById(productId).orElse(null);
        if (p == null) return dt;
        
        dt.name = p.getName();
        dt.barcode = p.getBarcode();
        dt.desc = p.getDescription();
        dt.brandId = p.getBrand() != null ? p.getBrand().getId() : null;
        dt.categoryIds = new ArrayList<>(p.getCategories().stream().map(ProductCategory::getId).toList());
        dt.tagIds = new ArrayList<>(p.getTags().stream().map(ProductTag::getId).toList());
        dt.ageRangeIds = new ArrayList<>(p.getAgeRanges().stream().map(ProductAgeRange::getId).toList());
        dt.petTypes = new ArrayList<>(p.getPetTypes());
        dt.status = p.getStatus() != null ? p.getStatus().name() : null;

        // Preload existing images
        for (fpt.teddypet.domain.entity.ProductImage img : p.getImages()) {
            if (!img.isDeleted()) {
                dt.images.add(new ProductImageItemRequest(
                        img.getId(),
                        img.getImageUrl(),
                        img.getAltText(),
                        img.getDisplayOrder()
                ));
            }
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
