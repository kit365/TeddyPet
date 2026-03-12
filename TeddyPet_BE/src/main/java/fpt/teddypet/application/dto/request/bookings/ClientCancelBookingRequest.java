package fpt.teddypet.application.dto.request.bookings;

public record ClientCancelBookingRequest(
        String reason,
        BankInformationPayload bankInformation
) {
}
