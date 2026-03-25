package fpt.teddypet.application.dto.email;

import java.util.List;

/**
 * Dữ liệu render email thông báo đặt lịch tại quầy thành công (Thymeleaf).
 */
public record WalkInBookingEmailModel(
        String bookingCode,
        String customerName,
        String customerPhone,
        String bookingDateFormatted,
        String totalFormatted,
        List<WalkInBookingEmailPetBlock> pets) {

    public record WalkInBookingEmailPetBlock(String petLabel, List<WalkInBookingEmailServiceLine> services) {
    }

    public record WalkInBookingEmailServiceLine(
            String serviceName,
            String scheduleSummary,
            String subtotalFormatted,
            List<String> addonNames) {
    }
}
