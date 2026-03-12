package fpt.teddypet.application.dto.request.bookings;

public record BankInformationPayload(
        String bankName,
        String bankCode,
        String accountNumber,
        String accountHolderName
) {
}
