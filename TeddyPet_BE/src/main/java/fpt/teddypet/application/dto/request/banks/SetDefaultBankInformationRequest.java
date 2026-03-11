package fpt.teddypet.application.dto.request.banks;

import jakarta.validation.constraints.NotNull;

public record SetDefaultBankInformationRequest(
        @NotNull(message = "isDefault là bắt buộc") Boolean isDefault) {
}

