package fpt.teddypet.application.dto.response.staff;

import fpt.teddypet.domain.enums.staff.PayrollStatusEnum;

import java.math.BigDecimal;

public record SalaryLogResponse(
        Long id,
        Long staffId,
        String staffName,
        int month,
        int year,
        long totalMinutes,
        BigDecimal baseSalaryAmount,
        BigDecimal totalCommission,
        BigDecimal totalDeduction,
        BigDecimal finalSalary,
        PayrollStatusEnum status
) {
}

