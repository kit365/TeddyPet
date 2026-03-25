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
                    "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
                    "/Library/Fonts/Arial Unicode.ttf",
                    "/System/Library/Fonts/Supplemental/Arial.ttf",
                    "/Library/Fonts/Arial.ttf",
                    "C:/Windows/Fonts/Arial.ttf",
                    "C:/Windows/Fonts/ARIALUNI.TTF",
                    "C:/Windows/Fonts/times.ttf",
                    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
                    "/usr/share/fonts/TTF/DejaVuSans.ttf",
                    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"
            };

            boolean fontFound = false;
            String familyName = "Arial Unicode MS";
            for (String path : commonFonts) {
                java.io.File fontFile = new java.io.File(path);
                if (fontFile.exists()) {
                    try {
                        builder.useFont(fontFile, familyName);
                        log.info("Đã đăng ký font PDF thành công: {} cho family: {}", path, familyName);
                        fontFound = true;

                        // Nếu tìm thấy Arial Unicode (bản full), ưu tiên lấy thêm các biến thể từ cùng thư mục
                        String dir = fontFile.getParent();
                        registerVariant(builder, dir, "Arial Bold.ttf", familyName, 700);
                        registerVariant(builder, dir, "Arial Italic.ttf", familyName, 400);
                        registerVariant(builder, dir, "Arial Bold Italic.ttf", familyName, 700);
                        
                        // Nếu là font Unicode bản lớn, có thể dừng lại sớm
                        if (path.toLowerCase().contains("unicode") || path.toLowerCase().contains("arialuni")) {
                            log.info("Sử dụng font Unicode chất lượng cao: {}", path);
                            break;
                        }
                    } catch (Exception fontEx) {
                        log.warn("Không thể load font {}: {}", path, fontEx.getMessage());
                    }
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

    private void registerVariant(PdfRendererBuilder builder, String dir, String fileName, String familyName, int weight) {
        java.io.File file = new java.io.File(dir, fileName);
        if (file.exists()) {
            builder.useFont(file, familyName, weight, com.openhtmltopdf.outputdevice.helper.BaseRendererBuilder.FontStyle.NORMAL, true);
        }
    }

    @Override
    public String getSupportedFormat() {
        return "PDF";
    }
}
