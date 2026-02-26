package fpt.teddypet.application.port.output.staff;

import fpt.teddypet.domain.entity.staff.Contract;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ContractRepositoryPort {

    Contract save(Contract contract);

    Optional<Contract> findById(Long id);

    List<Contract> findByStaffIdOrderByStartDateDesc(Long staffId);

    List<Contract> findActiveContractsForStaffInRange(Long staffId, LocalDate from, LocalDate to);
}

