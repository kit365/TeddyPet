package fpt.teddypet.application.service.staff;

import fpt.teddypet.application.dto.request.staff.ContractRequest;
import fpt.teddypet.application.dto.response.staff.ContractResponse;
import fpt.teddypet.application.port.input.staff.ContractService;
import fpt.teddypet.application.port.output.staff.ContractRepositoryPort;
import fpt.teddypet.application.port.output.staff.StaffProfileRepositoryPort;
import fpt.teddypet.domain.enums.staff.EmploymentTypeEnum;
import fpt.teddypet.domain.entity.staff.Contract;
import fpt.teddypet.domain.entity.staff.StaffProfile;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ContractApplicationService implements ContractService {

    private static final String STATUS_ACTIVE = "ACTIVE";
    private static final String STATUS_EXPIRED = "EXPIRED";
    private static final String ERROR_OVERLAP = "Nhân viên đã có hợp đồng hiệu lực trong khoảng thời gian này. Vui lòng cập nhật trạng thái hợp đồng cũ trước.";

    private final ContractRepositoryPort contractRepositoryPort;
    private final StaffProfileRepositoryPort staffProfileRepositoryPort;

    @Override
    @Transactional
    public ContractResponse create(ContractRequest request) {
        StaffProfile staff = staffProfileRepositoryPort.findById(request.staffId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy nhân viên với id: " + request.staffId()));

        validateNoOverlappingActiveContract(request.staffId(), request.startDate(), request.endDate(), null);

        String status = request.status() != null && !request.status().isBlank()
                ? request.status()
                : STATUS_ACTIVE;
        EmploymentTypeEnum contractType = request.contractType() != null ? request.contractType() : EmploymentTypeEnum.FULL_TIME;

        Contract contract = Contract.builder()
                .staff(staff)
                .contractType(contractType)
                .baseSalary(request.baseSalary())
                .startDate(request.startDate())
                .endDate(request.endDate())
                .status(status)
                .build();

        Contract saved = contractRepositoryPort.save(contract);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public ContractResponse update(Long contractId, ContractRequest request) {
        Contract contract = getActiveById(contractId);

        if (!contract.getStaff().getId().equals(request.staffId())) {
            StaffProfile staff = staffProfileRepositoryPort.findById(request.staffId())
                    .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy nhân viên với id: " + request.staffId()));
            contract.setStaff(staff);
        }

        validateNoOverlappingActiveContract(request.staffId(), request.startDate(), request.endDate(), contractId);

        if (request.contractType() != null) {
            contract.setContractType(request.contractType());
        }
        contract.setBaseSalary(request.baseSalary());
        contract.setStartDate(request.startDate());
        contract.setEndDate(request.endDate());
        if (request.status() != null && !request.status().isBlank()) {
            contract.setStatus(request.status());
        }

        Contract saved = contractRepositoryPort.save(contract);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public void delete(Long contractId) {
        Contract contract = getActiveById(contractId);
        contract.setActive(false);
        contract.setDeleted(true);
        contract.setStatus(STATUS_EXPIRED);
        contractRepositoryPort.save(contract);
    }

    @Override
    public ContractResponse getById(Long contractId) {
        return toResponse(getActiveById(contractId));
    }

    @Override
    public List<ContractResponse> getByStaffId(Long staffId) {
        return contractRepositoryPort.findByStaffIdOrderByStartDateDesc(staffId)
                .stream()
                .filter(c -> !c.isDeleted() && c.isActive())
                .map(this::toResponse)
                .toList();
    }

    private Contract getActiveById(Long contractId) {
        return contractRepositoryPort.findById(contractId)
                .filter(c -> !c.isDeleted() && c.isActive())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy hợp đồng với id: " + contractId));
    }

    private void validateNoOverlappingActiveContract(Long staffId, LocalDate startDate, LocalDate endDate, Long excludeContractId) {
        LocalDate to = endDate != null ? endDate : LocalDate.MAX;
        List<Contract> overlapping = contractRepositoryPort.findActiveContractsForStaffInRange(staffId, startDate, to);
        boolean hasOther = excludeContractId == null
                ? !overlapping.isEmpty()
                : overlapping.stream().anyMatch(c -> !c.getId().equals(excludeContractId));
        if (hasOther) {
            throw new IllegalArgumentException(ERROR_OVERLAP);
        }
    }

    private ContractResponse toResponse(Contract contract) {
        return new ContractResponse(
                contract.getId(),
                contract.getStaff().getId(),
                contract.getContractType(),
                contract.getBaseSalary(),
                contract.getStartDate(),
                contract.getEndDate(),
                contract.getStatus()
        );
    }
}
