package fpt.teddypet.application.port.input.staff;

import fpt.teddypet.application.service.products.SimpleEntityExcelService.ImportResult;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.multipart.MultipartFile;

public interface StaffExcelService {
    void exportStaffToExcel(HttpServletResponse response);

    void downloadStaffTemplate(HttpServletResponse response);

    ImportResult importStaffFromExcel(MultipartFile file);
}
