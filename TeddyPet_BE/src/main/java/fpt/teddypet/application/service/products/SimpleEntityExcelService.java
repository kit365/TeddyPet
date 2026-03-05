package fpt.teddypet.application.service.products;

import fpt.teddypet.domain.entity.ProductBrand;
import fpt.teddypet.domain.entity.ProductCategory;
import fpt.teddypet.domain.entity.ProductTag;
import fpt.teddypet.domain.entity.ProductAgeRange;
import fpt.teddypet.infrastructure.persistence.postgres.repository.products.ProductBrandRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.products.ProductCategoryRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.products.ProductTagRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.products.ProductAgeRangeRepository;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;

/**
 * Service Excel dùng chung cho Brand, Category, Tag.
 * Mỗi entity chỉ cần export/import các trường cơ bản (không phức tạp như
 * Product).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SimpleEntityExcelService {

    private final ProductBrandRepository brandRepository;
    private final ProductCategoryRepository categoryRepository;
    private final ProductTagRepository tagRepository;
    private final ProductAgeRangeRepository ageRangeRepository;

    public record ImportResult(int created, int updated, int skipped, List<String> errors) {
    }

    // ═══════════════════════════════════════════════════════════════════════
    // BRAND
    // ═══════════════════════════════════════════════════════════════════════

    public void exportBrands(HttpServletResponse response) {
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader("Content-Disposition", "attachment; filename=brands_export.xlsx");
        try (XSSFWorkbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Thương Hiệu");
            CellStyle header = ExcelStyleHelper.productHeaderStyle(wb);
            String[] headers = { "ID", "Tên Thương Hiệu *", "Mô Tả", "Website URL" };
            writeHeader(sheet, header, headers);

            int row = 1;
            for (ProductBrand b : brandRepository.findAll()) {
                Row r = sheet.createRow(row++);
                r.createCell(0).setCellValue(safeVal(b.getId()));
                r.createCell(1).setCellValue(safeStr(b.getName()));
                r.createCell(2).setCellValue(safeStr(b.getDescription()));
                r.createCell(3).setCellValue(safeStr(b.getWebsiteUrl()));
            }
            autoSizeAll(sheet, headers.length);
            wb.write(response.getOutputStream());
        } catch (IOException e) {
            throw new RuntimeException("Không thể xuất brand.", e);
        }
    }

    public void downloadBrandTemplate(HttpServletResponse response) {
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader("Content-Disposition", "attachment; filename=brands_template.xlsx");
        try (XSSFWorkbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Thương Hiệu");
            CellStyle header = ExcelStyleHelper.productHeaderStyle(wb);
            String[] headers = { "ID", "Tên Thương Hiệu *", "Mô Tả", "Website URL" };
            writeHeader(sheet, header, headers);
            Row sample = sheet.createRow(1);
            sample.createCell(0).setCellValue("(để trống khi tạo mới)");
            sample.createCell(1).setCellValue("Royal Canin");
            sample.createCell(2).setCellValue("Thương hiệu thức ăn thú cưng nổi tiếng");
            sample.createCell(3).setCellValue("https://royalcanin.com");
            autoSizeAll(sheet, headers.length);
            wb.write(response.getOutputStream());
        } catch (IOException e) {
            throw new RuntimeException("Không thể tạo template brand.", e);
        }
    }

    public ImportResult importBrands(MultipartFile file) {
        if (file.isEmpty())
            throw new IllegalArgumentException("File trống.");
        int created = 0, updated = 0, skipped = 0;
        List<String> errors = new ArrayList<>();

        try (Workbook wb = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = wb.getSheetAt(0);
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null)
                    continue;
                String name = getCellStr(row.getCell(1));
                if (!StringUtils.hasText(name)) {
                    skipped++;
                    continue;
                }

                String desc = getCellStr(row.getCell(2));
                String website = getCellStr(row.getCell(3));
                Long id = getCellLong(row.getCell(0));

                try {
                    if (id != null) {
                        // Update
                        ProductBrand brand = brandRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy brand ID=" + id));
                        brand.setName(name);
                        if (StringUtils.hasText(desc))
                            brand.setDescription(desc);
                        if (StringUtils.hasText(website))
                            brand.setWebsiteUrl(website);
                        brandRepository.save(brand);
                        updated++;
                    } else {
                        // Create
                        if (brandRepository.findAll().stream().anyMatch(b -> b.getName().equalsIgnoreCase(name))) {
                            errors.add("Dòng " + (i + 1) + ": Thương hiệu '" + name + "' đã tồn tại.");
                            skipped++;
                            continue;
                        }
                        ProductBrand brand = new ProductBrand();
                        brand.setName(name);
                        brand.setSlug(toSlug(name));
                        if (StringUtils.hasText(desc))
                            brand.setDescription(desc);
                        if (StringUtils.hasText(website))
                            brand.setWebsiteUrl(website);
                        brandRepository.save(brand);
                        created++;
                    }
                } catch (Exception e) {
                    errors.add("Dòng " + (i + 1) + " [" + name + "]: " + e.getMessage());
                }
            }
        } catch (IOException e) {
            throw new RuntimeException("Không thể đọc file brand.", e);
        }
        log.info("Brand import: tạo={}, cập nhật={}, bỏ qua={}, lỗi={}", created, updated, skipped, errors.size());
        return new ImportResult(created, updated, skipped, errors);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CATEGORY
    // ═══════════════════════════════════════════════════════════════════════

    public void exportCategories(HttpServletResponse response) {
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader("Content-Disposition", "attachment; filename=categories_export.xlsx");
        try (XSSFWorkbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Danh Mục");
            CellStyle header = ExcelStyleHelper.productHeaderStyle(wb);
            String[] headers = { "ID", "Tên Danh Mục *", "Danh Mục Cha (tên)", "Mô Tả" };
            writeHeader(sheet, header, headers);

            int row = 1;
            for (ProductCategory c : categoryRepository.findAll()) {
                Row r = sheet.createRow(row++);
                r.createCell(0).setCellValue(safeVal(c.getId()));
                r.createCell(1).setCellValue(safeStr(c.getName()));
                r.createCell(2).setCellValue(c.getParent() != null ? c.getParent().getName() : "");
                r.createCell(3).setCellValue(safeStr(c.getDescription()));
            }
            autoSizeAll(sheet, headers.length);
            wb.write(response.getOutputStream());
        } catch (IOException e) {
            throw new RuntimeException("Không thể xuất category.", e);
        }
    }

    public void downloadCategoryTemplate(HttpServletResponse response) {
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader("Content-Disposition", "attachment; filename=categories_template.xlsx");
        try (XSSFWorkbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Danh Mục");
            CellStyle header = ExcelStyleHelper.productHeaderStyle(wb);
            String[] headers = { "ID", "Tên Danh Mục *", "Danh Mục Cha (tên)", "Mô Tả" };
            writeHeader(sheet, header, headers);
            Row s1 = sheet.createRow(1);
            s1.createCell(0).setCellValue("(để trống khi tạo mới)");
            s1.createCell(1).setCellValue("Thức ăn khô");
            s1.createCell(2).setCellValue("Thức ăn");
            s1.createCell(3).setCellValue("Dành cho chó và mèo");
            Row s2 = sheet.createRow(2);
            s2.createCell(1).setCellValue("Đồ chơi thú cưng");
            s2.createCell(2).setCellValue("");
            s2.createCell(3).setCellValue("Danh mục gốc, không có cha");
            autoSizeAll(sheet, headers.length);
            wb.write(response.getOutputStream());
        } catch (IOException e) {
            throw new RuntimeException("Không thể tạo template category.", e);
        }
    }

    public ImportResult importCategories(MultipartFile file) {
        if (file.isEmpty())
            throw new IllegalArgumentException("File trống.");
        int created = 0, updated = 0, skipped = 0;
        List<String> errors = new ArrayList<>();

        try (Workbook wb = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = wb.getSheetAt(0);
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null)
                    continue;
                String name = getCellStr(row.getCell(1));
                if (!StringUtils.hasText(name)) {
                    skipped++;
                    continue;
                }

                String parentName = getCellStr(row.getCell(2));
                String desc = getCellStr(row.getCell(3));
                Long id = getCellLong(row.getCell(0));

                try {
                    ProductCategory parent = null;
                    if (StringUtils.hasText(parentName)) {
                        parent = categoryRepository.findByNameIgnoreCase(parentName)
                                .orElse(null);
                        if (parent == null) {
                            errors.add("Dòng " + (i + 1) + ": Danh mục cha '" + parentName + "' không tồn tại.");
                            skipped++;
                            continue;
                        }
                    }

                    if (id != null) {
                        ProductCategory cat = categoryRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy category ID=" + id));
                        cat.setName(name);
                        cat.setParent(parent);
                        if (StringUtils.hasText(desc))
                            cat.setDescription(desc);
                        categoryRepository.save(cat);
                        updated++;
                    } else {
                        ProductCategory cat = new ProductCategory();
                        cat.setName(name);
                        cat.setSlug(toSlug(name));
                        cat.setParent(parent);
                        if (StringUtils.hasText(desc))
                            cat.setDescription(desc);
                        categoryRepository.save(cat);
                        created++;
                    }
                } catch (Exception e) {
                    errors.add("Dòng " + (i + 1) + " [" + name + "]: " + e.getMessage());
                }
            }
        } catch (IOException e) {
            throw new RuntimeException("Không thể đọc file category.", e);
        }
        log.info("Category import: tạo={}, cập nhật={}, bỏ qua={}, lỗi={}", created, updated, skipped, errors.size());
        return new ImportResult(created, updated, skipped, errors);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TAG
    // ═══════════════════════════════════════════════════════════════════════

    public void exportTags(HttpServletResponse response) {
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader("Content-Disposition", "attachment; filename=tags_export.xlsx");
        try (XSSFWorkbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Tags");
            CellStyle header = ExcelStyleHelper.productHeaderStyle(wb);
            String[] headers = { "ID", "Tên Tag *", "Mô Tả", "Màu (#hex)" };
            writeHeader(sheet, header, headers);

            int row = 1;
            for (ProductTag t : tagRepository.findAll()) {
                Row r = sheet.createRow(row++);
                r.createCell(0).setCellValue(safeVal(t.getId()));
                r.createCell(1).setCellValue(safeStr(t.getName()));
                r.createCell(2).setCellValue(safeStr(t.getDescription()));
                r.createCell(3).setCellValue(safeStr(t.getColor()));
            }
            autoSizeAll(sheet, headers.length);
            wb.write(response.getOutputStream());
        } catch (IOException e) {
            throw new RuntimeException("Không thể xuất tag.", e);
        }
    }

    public void downloadTagTemplate(HttpServletResponse response) {
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader("Content-Disposition", "attachment; filename=tags_template.xlsx");
        try (XSSFWorkbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Tags");
            CellStyle header = ExcelStyleHelper.productHeaderStyle(wb);
            String[] headers = { "ID", "Tên Tag *", "Mô Tả", "Màu (#hex)" };
            writeHeader(sheet, header, headers);
            Row s = sheet.createRow(1);
            s.createCell(0).setCellValue("(để trống khi tạo mới)");
            s.createCell(1).setCellValue("BEST_SELLER");
            s.createCell(2).setCellValue("Sản phẩm bán chạy");
            s.createCell(3).setCellValue("#FF4842");
            autoSizeAll(sheet, headers.length);
            wb.write(response.getOutputStream());
        } catch (IOException e) {
            throw new RuntimeException("Không thể tạo template tag.", e);
        }
    }

    public ImportResult importTags(MultipartFile file) {
        if (file.isEmpty())
            throw new IllegalArgumentException("File trống.");
        int created = 0, updated = 0, skipped = 0;
        List<String> errors = new ArrayList<>();

        try (Workbook wb = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = wb.getSheetAt(0);
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null)
                    continue;
                String name = getCellStr(row.getCell(1));
                if (!StringUtils.hasText(name)) {
                    skipped++;
                    continue;
                }

                String desc = getCellStr(row.getCell(2));
                String color = getCellStr(row.getCell(3));
                Long id = getCellLong(row.getCell(0));

                try {
                    if (id != null) {
                        ProductTag tag = tagRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy tag ID=" + id));
                        tag.setName(name);
                        if (StringUtils.hasText(desc))
                            tag.setDescription(desc);
                        if (StringUtils.hasText(color))
                            tag.setColor(color);
                        tagRepository.save(tag);
                        updated++;
                    } else {
                        if (tagRepository.existsByName(name)) {
                            errors.add("Dòng " + (i + 1) + ": Tag '" + name + "' đã tồn tại.");
                            skipped++;
                            continue;
                        }
                        ProductTag tag = new ProductTag();
                        tag.setName(name);
                        tag.setSlug(toSlug(name.toLowerCase()));
                        if (StringUtils.hasText(desc))
                            tag.setDescription(desc);
                        if (StringUtils.hasText(color))
                            tag.setColor(color);
                        tagRepository.save(tag);
                        created++;
                    }
                } catch (Exception e) {
                    errors.add("Dòng " + (i + 1) + " [" + name + "]: " + e.getMessage());
                }
            }
        } catch (IOException e) {
            throw new RuntimeException("Không thể đọc file tag.", e);
        }
        log.info("Tag import: tạo={}, cập nhật={}, bỏ qua={}, lỗi={}", created, updated, skipped, errors.size());
        return new ImportResult(created, updated, skipped, errors);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // AGE RANGE
    // ═══════════════════════════════════════════════════════════════════════

    public void exportAgeRanges(HttpServletResponse response) {
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader("Content-Disposition", "attachment; filename=ageranges_export.xlsx");
        try (XSSFWorkbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Độ Tuổi");
            CellStyle header = ExcelStyleHelper.productHeaderStyle(wb);
            String[] headers = { "ID", "Tên Độ Tuổi *", "Mô Tả" };
            writeHeader(sheet, header, headers);

            int row = 1;
            for (ProductAgeRange a : ageRangeRepository.findAll()) {
                Row r = sheet.createRow(row++);
                r.createCell(0).setCellValue(safeVal(a.getId()));
                r.createCell(1).setCellValue(safeStr(a.getName()));
                r.createCell(2).setCellValue(safeStr(a.getDescription()));
            }
            autoSizeAll(sheet, headers.length);
            wb.write(response.getOutputStream());
        } catch (IOException e) {
            throw new RuntimeException("Không thể xuất age range.", e);
        }
    }

    public void downloadAgeRangeTemplate(HttpServletResponse response) {
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader("Content-Disposition", "attachment; filename=ageranges_template.xlsx");
        try (XSSFWorkbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Độ Tuổi");
            CellStyle header = ExcelStyleHelper.productHeaderStyle(wb);
            String[] headers = { "ID", "Tên Độ Tuổi *", "Mô Tả" };
            writeHeader(sheet, header, headers);
            Row s = sheet.createRow(1);
            s.createCell(0).setCellValue("(để trống khi tạo mới)");
            s.createCell(1).setCellValue("PUPPY");
            s.createCell(2).setCellValue("Dành cho chó con từ 1 - 12 tháng tuổi");
            autoSizeAll(sheet, headers.length);
            wb.write(response.getOutputStream());
        } catch (IOException e) {
            throw new RuntimeException("Không thể tạo template age range.", e);
        }
    }

    public ImportResult importAgeRanges(MultipartFile file) {
        if (file.isEmpty())
            throw new IllegalArgumentException("File trống.");
        int created = 0, updated = 0, skipped = 0;
        List<String> errors = new ArrayList<>();

        try (Workbook wb = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = wb.getSheetAt(0);
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null)
                    continue;
                String name = getCellStr(row.getCell(1));
                if (!StringUtils.hasText(name)) {
                    skipped++;
                    continue;
                }

                String desc = getCellStr(row.getCell(2));
                Long id = getCellLong(row.getCell(0));

                try {
                    if (id != null) {
                        ProductAgeRange ar = ageRangeRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy age range ID=" + id));
                        ar.setName(name);
                        if (StringUtils.hasText(desc))
                            ar.setDescription(desc);
                        ageRangeRepository.save(ar);
                        updated++;
                    } else {
                        if (ageRangeRepository.existsByName(name)) {
                            errors.add("Dòng " + (i + 1) + ": Độ tuổi '" + name + "' đã tồn tại.");
                            skipped++;
                            continue;
                        }
                        ProductAgeRange ar = new ProductAgeRange();
                        ar.setName(name);
                        if (StringUtils.hasText(desc))
                            ar.setDescription(desc);
                        ageRangeRepository.save(ar);
                        created++;
                    }
                } catch (Exception e) {
                    errors.add("Dòng " + (i + 1) + " [" + name + "]: " + e.getMessage());
                }
            }
        } catch (IOException e) {
            throw new RuntimeException("Không thể đọc file age range.", e);
        }
        log.info("Age Range import: tạo={}, cập nhật={}, bỏ qua={}, lỗi={}", created, updated, skipped, errors.size());
        return new ImportResult(created, updated, skipped, errors);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════════════════

    private void writeHeader(Sheet sheet, CellStyle style, String[] headers) {
        Row row = sheet.createRow(0);
        for (int i = 0; i < headers.length; i++) {
            Cell cell = row.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(style);
        }
    }

    private void autoSizeAll(Sheet sheet, int cols) {
        for (int i = 0; i < cols; i++)
            sheet.autoSizeColumn(i);
    }

    private String safeStr(String s) {
        return s != null ? s : "";
    }

    private String safeVal(Long v) {
        return v != null ? String.valueOf(v) : "";
    }

    private String getCellStr(Cell cell) {
        if (cell == null)
            return "";
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue().trim();
            case NUMERIC -> String.valueOf((long) cell.getNumericCellValue());
            default -> "";
        };
    }

    private Long getCellLong(Cell cell) {
        if (cell == null)
            return null;
        String val = getCellStr(cell);
        if (!StringUtils.hasText(val) || val.startsWith("("))
            return null;
        try {
            return Long.parseLong(val);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private String toSlug(String text) {
        if (text == null)
            return "";
        String slug = text.toLowerCase()
                .replaceAll("[àáạảãâầấậẩẫăằắặẳẵ]", "a")
                .replaceAll("[èéẹẻẽêềếệểễ]", "e")
                .replaceAll("[ìíịỉĩ]", "i")
                .replaceAll("[òóọỏõôồốộổỗơờớợởỡ]", "o")
                .replaceAll("[ùúụủũưừứựửữ]", "u")
                .replaceAll("[ỳýỵỷỹ]", "y")
                .replaceAll("[đ]", "d")
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-");
        return slug + "-" + System.currentTimeMillis() % 10000;
    }
}
