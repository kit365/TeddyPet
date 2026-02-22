package fpt.teddypet.application.port.output.document;

import java.util.Map;

/**
 * Cổng ra (Output Port) để tạo các loại tài liệu vật lý.
 * Lớp Infrastructure sẽ implement cái này (ví dụ dùng iText, Flying Saucer).
 */
public interface DocumentGeneratorPort {

    /**
     * Tạo tài liệu từ template và dữ liệu
     * 
     * @param templatePath Đường dẫn tới file template (html/jrxml...)
     * @param data         Map chứa dữ liệu để đổ vào template
     * @return Mảng byte của file hoàn thiện
     */
    byte[] generate(String templatePath, Map<String, Object> data);

    /**
     * Định danh loại generator (PDF, Excel, HTML...)
     */
    String getSupportedFormat();
}
