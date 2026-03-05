package fpt.teddypet.infrastructure.adapter.staff;

import fpt.teddypet.application.port.output.staff.ContractRepositoryPort;
import fpt.teddypet.domain.entity.staff.Contract;
import fpt.teddypet.infrastructure.persistence.postgres.repository.staff.ContractRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class ContractRepositoryAdapter implements ContractRepositoryPort {

    private final ContractRepository contractRepository;

    @Override
    public Contract save(Contract contract) {
        return contractRepository.save(contract);
    }

    @Override
    public Optional<Contract> findById(Long id) {
        return contractRepository.findById(id);
    }

    @Override
    public List<Contract> findByStaffIdOrderByStartDateDesc(Long staffId) {
        return contractRepository.findByStaffIdOrderByStartDateDesc(staffId);
    }

    @Override
    public List<Contract> findActiveContractsForStaffInRange(Long staffId, LocalDate from, LocalDate to) {
        return contractRepository.findActiveContractsForStaffInRange(staffId, from, to);
    }
}

