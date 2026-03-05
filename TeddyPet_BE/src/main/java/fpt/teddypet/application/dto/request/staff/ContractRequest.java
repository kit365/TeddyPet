package fpt.teddypet.application.dto.request.staff;

import fpt.teddypet.domain.enums.staff.EmploymentTypeEnum;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ContractRequest(
        @NotNull
        Long staffId,

        EmploymentTypeEnum contractType,

        @NotNull
        @DecimalMin(value = "0.01", inclusive = true, message = "Lương phải lớn hơn 0")
        BigDecimal baseSalary,

        @NotNull
        LocalDate startDate,

        LocalDate endDate,

        String status
) {
}
