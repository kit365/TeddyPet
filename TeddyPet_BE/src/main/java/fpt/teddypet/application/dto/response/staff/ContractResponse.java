package fpt.teddypet.application.dto.response.staff;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ContractResponse(
        Long contractId,
        Long staffId,
        BigDecimal baseSalary,
        LocalDate startDate,
        LocalDate endDate,
        String status
) {
}
