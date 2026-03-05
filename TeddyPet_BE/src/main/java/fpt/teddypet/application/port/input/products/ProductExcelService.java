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

    void exportProductsToExcel(HttpServletResponse response);

    /**
     * Nhập danh sách sản phẩm từ file Excel.
     * Trả về kết quả chi tiết để FE hiển thị thông báo.
     */
    ImportResult importProductsFromExcel(MultipartFile file);

    void downloadTemplate(HttpServletResponse response);
}
