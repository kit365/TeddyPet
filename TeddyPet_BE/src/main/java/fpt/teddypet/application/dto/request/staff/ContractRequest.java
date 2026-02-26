package fpt.teddypet.application.dto.request.staff;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ContractRequest(
        @NotNull
        Long staffId,

        @NotNull
        @DecimalMin(value = "0.00", message = "Lương cơ bản phải >= 0")
        BigDecimal baseSalary,

        @NotNull
        LocalDate startDate,

        LocalDate endDate,

        String status
) {
}
