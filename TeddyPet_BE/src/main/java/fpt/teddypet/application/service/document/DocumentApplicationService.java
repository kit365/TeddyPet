package fpt.teddypet.application.service.document;

import fpt.teddypet.application.dto.response.orders.order.OrderResponse;
import fpt.teddypet.application.dto.response.bookings.AdminBookingListItemResponse;
import fpt.teddypet.application.dto.response.bookings.AdminBookingPetResponse;
import fpt.teddypet.application.port.input.bookings.BookingAdminService;
import fpt.teddypet.application.port.input.pdf.PdfService;
import fpt.teddypet.application.port.output.document.DocumentGeneratorPort;
import fpt.teddypet.application.port.input.orders.order.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Application Service cho việc tạo tài liệu.
 * Chỉ chứa logic nghiệp vụ (lấy data, chuẩn bị model),
 * delegate việc render cho DocumentGeneratorPort (Adapter).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentApplicationService implements PdfService {

    private final OrderService orderService;
    private final BookingAdminService bookingAdminService;
    private final DocumentGeneratorPort pdfGenerator;
    private final fpt.teddypet.infrastructure.persistence.postgres.repository.settings.AppSettingRepository appSettingRepository;

    @org.springframework.beans.factory.annotation.Value("${app.name:TeddyPet}")
    private String appName;

    @org.springframework.beans.factory.annotation.Value("${app.hotline:1900 1234}")
    private String hotline;

    @org.springframework.beans.factory.annotation.Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Override
    public byte[] generateInvoicePdf(UUID orderId) {
        log.info("Generating invoice PDF for orderId: {}", orderId);

        OrderResponse order = orderService.getByIdResponse(orderId);
        Map<String, Object> templateData = new HashMap<>();
        templateData.put("order", order);
        applyGlobalTemplateData(templateData);
        templateData.put("orderCode", order.orderCode());
        templateData.put("orderDate", order.createdAt().atZone(java.time.ZoneId.systemDefault())
                .format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy")));
        return pdfGenerator.generate("invoice_template", templateData);
    }

    @Override
    public byte[] generateBookingInvoicePdf(Long bookingId) {
        log.info("Generating booking invoice PDF for bookingId: {}", bookingId);
        AdminBookingListItemResponse booking = bookingAdminService.getBookingBasic(bookingId);
        java.util.List<AdminBookingPetResponse> pets = bookingAdminService.getPets(bookingId);

        Map<String, Object> templateData = new HashMap<>();
        templateData.put("booking", booking);
        templateData.put("pets", pets);
        applyGlobalTemplateData(templateData);
        templateData.put("bookingCode", booking.bookingCode());
        templateData.put(
                "bookingDate",
                booking.createdAt() != null
                        ? booking.createdAt().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"))
                        : "N/A");
        return pdfGenerator.generate("booking_invoice_template", templateData);
    }

    private void applyGlobalTemplateData(Map<String, Object> templateData) {
        templateData.put("appName", appName);
        templateData.put("hotline", hotline);
        templateData.put("webUrl", frontendUrl);

        String facebookUrl = appSettingRepository.findBySettingKey("SOCIAL_FACEBOOK")
                .map(fpt.teddypet.domain.entity.AppSetting::getSettingValue)
                .orElse("https://facebook.com");
        String instagramUrl = appSettingRepository.findBySettingKey("SOCIAL_INSTAGRAM")
                .map(fpt.teddypet.domain.entity.AppSetting::getSettingValue)
                .orElse("https://instagram.com");

        templateData.put("facebookUrl", facebookUrl);
        templateData.put("instagramUrl", instagramUrl);
    }
}
