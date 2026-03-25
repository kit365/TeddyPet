package fpt.teddypet.infrastructure.persistence.postgres.repository.staff;

import fpt.teddypet.domain.entity.staff.SalaryLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SalaryLogRepository extends JpaRepository<SalaryLog, Long> {

    Optional<SalaryLog> findByStaff_IdAndMonthAndYear(Long staffId, int month, int year);

    List<SalaryLog> findByMonthAndYear(int month, int year);
}

