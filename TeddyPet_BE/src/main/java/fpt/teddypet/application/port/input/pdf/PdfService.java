package fpt.teddypet.application.port.input.pdf;

import java.util.UUID;

public interface PdfService {
    byte[] generateInvoicePdf(UUID orderId);
    byte[] generateBookingInvoicePdf(Long bookingId);
}
