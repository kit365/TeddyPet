package fpt.teddypet.infrastructure.adapter.staff;

import fpt.teddypet.application.port.output.staff.SalaryLogRepositoryPort;
import fpt.teddypet.domain.entity.staff.SalaryLog;
import fpt.teddypet.infrastructure.persistence.postgres.repository.staff.SalaryLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class SalaryLogRepositoryAdapter implements SalaryLogRepositoryPort {

    private final SalaryLogRepository salaryLogRepository;

    @Override
    public SalaryLog save(SalaryLog salaryLog) {
        return salaryLogRepository.save(salaryLog);
    }

    @Override
    public Optional<SalaryLog> findByStaffIdAndMonthAndYear(Long staffId, int month, int year) {
        return salaryLogRepository.findByStaff_IdAndMonthAndYear(staffId, month, year);
    }

    @Override
    public List<SalaryLog> findByMonthAndYear(int month, int year) {
        return salaryLogRepository.findByMonthAndYear(month, year);
    }
}

