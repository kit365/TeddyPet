package fpt.teddypet.application.dto.request.banks;

import jakarta.validation.constraints.NotNull;

public record VerifyBankInformationRequest(
        @NotNull(message = "isVerify là bắt buộc") Boolean isVerify) {
}

