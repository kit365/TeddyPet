package fpt.teddypet.application.dto.request.banks;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpsertBankInformationRequest(
        @NotBlank(message = "accountNumber là bắt buộc")
        @Size(max = 50, message = "accountNumber tối đa 50 ký tự")
        String accountNumber,

        @NotBlank(message = "accountHolderName là bắt buộc")
        @Size(max = 255, message = "accountHolderName tối đa 255 ký tự")
        String accountHolderName,

        @NotBlank(message = "bankCode là bắt buộc")
        @Size(max = 50, message = "bankCode tối đa 50 ký tự")
        String bankCode,

        @Size(max = 2000, message = "note tối đa 2000 ký tự")
        String note
) {
}

