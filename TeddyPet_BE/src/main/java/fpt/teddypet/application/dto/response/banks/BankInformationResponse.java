package fpt.teddypet.application.dto.response.banks;

import java.time.LocalDateTime;

public record BankInformationResponse(
        Long id,
        String accountNumber,
        String accountHolderName,
        String bankCode,
        String bankName,
        Boolean isVerify,
        Boolean isDefault,
        String note,
        Long bookingId,
        String userId,
        String vietqrImageUrl,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {
}

