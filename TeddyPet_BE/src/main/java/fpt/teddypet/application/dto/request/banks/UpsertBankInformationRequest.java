package fpt.teddypet.application.dto.request.banks;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpsertBankInformationRequest(
        @NotBlank(message = "Số tài khoản là bắt buộc")
        @Size(min = 6, max = 19, message = "Số tài khoản phải từ 6 đến 19 ký tự")
        @Pattern(regexp = "^[0-9]+$", message = "Số tài khoản chỉ được chứa chữ số (0-9)")
        String accountNumber,

        @NotBlank(message = "Chủ tài khoản là bắt buộc")
        @Size(max = 255, message = "Chủ tài khoản tối đa 255 ký tự")
        String accountHolderName,

        @NotBlank(message = "Ngân hàng là bắt buộc")
        @Size(max = 50, message = "bankCode tối đa 50 ký tự")
        String bankCode,

        @Size(max = 2000, message = "note tối đa 2000 ký tự")
        String note
) {
}

