package fpt.teddypet.application.port.input.products;

import org.springframework.web.multipart.MultipartFile;
import jakarta.servlet.http.HttpServletResponse;

import java.util.List;

public interface ProductExcelService {

    /**
     * Kết quả import: số dòng đã xử lý, lỗi gặp phải, cảnh báo.
     */
    record ImportResult(
            int created,
            int updated,
            int skipped,
            List<String> errors) {
        public boolean hasErrors() {
            return !errors.isEmpty();
        }

        public int total() {
            return created + updated + skipped;
        }
    }

    /**
     * Dòng Excel (không có PRODUCT_ID) khớp SP trong DB theo barcode/slug nhưng tên khác → cần chọn Tạo mới / Ghi đè.
     */
    record DuplicateRowPreview(
            int rowNumber,
            String excelProductName,
            String excelBarcode,
            String matchSource,
            Long matchedProductId,
            String matchedProductName) {
    }

    record ImportPreview(
            List<String> missingBrands,
            List<String> missingCategories,
            List<String> missingTags,
            List<String> missingAgeRanges,
            List<String> missingAttributes,
            List<DuplicateRowPreview> duplicateRows) {
    }

    record ConfirmCreateResult(
            int createdBrands,
            int createdCategories,
            int createdTags,
            int createdAgeRanges,
            int createdAttributes
    ) {}

    void exportProductsToExcel(HttpServletResponse response);

    /**
     * Nhập danh sách sản phẩm từ file Excel.
     * Trả về kết quả chi tiết để FE hiển thị thông báo.
     */
    /**
     * @param duplicateResolutionsJson JSON mảng [{ "rowNumber": 5, "decision": "OVERWRITE"|"CREATE_NEW" }].
     *                                 Dòng có tên khác SP trùng: mặc định CREATE_NEW nếu không gửi OVERWRITE.
     */
    ImportResult importProductsFromExcel(MultipartFile file, String duplicateResolutionsJson);

    void downloadTemplate(HttpServletResponse response);

    ImportPreview previewImport(MultipartFile file);

    ConfirmCreateResult confirmCreateMissing(ImportPreview preview);
}
