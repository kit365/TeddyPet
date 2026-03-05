package fpt.teddypet.application.dto.response.staff;

import fpt.teddypet.domain.enums.staff.EmploymentTypeEnum;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ContractResponse(
        Long contractId,
        Long staffId,
        EmploymentTypeEnum contractType,
        BigDecimal baseSalary,
        LocalDate startDate,
        LocalDate endDate,
        String status
) {
}
