package fpt.teddypet.infrastructure.adapter.document;

import fpt.teddypet.application.port.output.document.DocumentGeneratorPort;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;

import java.io.ByteArrayOutputStream;
import java.nio.file.FileSystems;
import java.util.Map;

/**
 * Adapter thực tế sử dụng Thymeleaf để render HTML và OpenHTMLToPDF để xuất
 * file PDF.
 * Nếu sau này muốn đổi sang iText, JasperReports... chỉ cần tạo adapter mới
 * implement DocumentGeneratorPort.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ThymeleafPdfAdapter implements DocumentGeneratorPort {

    private final TemplateEngine templateEngine;

    @Override
    public byte[] generate(String templatePath, Map<String, Object> data) {
        try (ByteArrayOutputStream os = new ByteArrayOutputStream()) {
            // 1. Dùng Thymeleaf trộn data vào HTML template
            Context context = new Context();
            context.setVariables(data);
            String htmlContent = templateEngine.process(templatePath, context);

            // 2. Chuyển HTML sang PDF bằng OpenHTMLToPDF
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.useFastMode();

            // Register Fonts for Vietnamese support (Fix for '#' symbols)
            // On Mac, we check common locations for Arial Unicode or Arial
            String[] commonFonts = {
                    "/Library/Fonts/Arial Unicode.ttf",
                    "/System/Library/Fonts/Supplemental/Arial.ttf",
                    "/Library/Fonts/Arial.ttf"
            };

            boolean fontFound = false;
            for (String path : commonFonts) {
                java.io.File fontFile = new java.io.File(path);
                if (fontFile.exists()) {
                    builder.useFont(fontFile, "Arial Unicode MS"); // We map all to this family name for simplicity in
                                                                   // CSS
                    log.info("Đã đăng ký font PDF: {}", path);
                    fontFound = true;
                    break;
                }
            }

            if (!fontFound) {
                log.warn("Không tìm thấy font Tiếng Việt phù hợp. PDF có thể bị lỗi hiển thị.");
            }

            builder.withHtmlContent(htmlContent, FileSystems.getDefault().getPath(".").toUri().toString());
            builder.toStream(os);
            builder.run();

            return os.toByteArray();
        } catch (Exception e) {
            log.error("Lỗi khi tạo file PDF: {}", e.getMessage(), e);
            throw new RuntimeException("Lỗi khi tạo file PDF: " + e.getMessage(), e);
        }
    }

    @Override
    public String getSupportedFormat() {
        return "PDF";
    }
}
