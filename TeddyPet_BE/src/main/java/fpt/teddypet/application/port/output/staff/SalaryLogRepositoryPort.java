package fpt.teddypet.application.port.output.staff;

import fpt.teddypet.domain.entity.staff.SalaryLog;

import java.util.List;
import java.util.Optional;

public interface SalaryLogRepositoryPort {

    SalaryLog save(SalaryLog salaryLog);

    Optional<SalaryLog> findByStaffIdAndMonthAndYear(Long staffId, int month, int year);

    List<SalaryLog> findByMonthAndYear(int month, int year);
}

