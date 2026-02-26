package fpt.teddypet.application.port.input.staff;

import fpt.teddypet.application.dto.request.staff.ContractRequest;
import fpt.teddypet.application.dto.response.staff.ContractResponse;

import java.util.List;

public interface ContractService {

    ContractResponse create(ContractRequest request);

    ContractResponse update(Long contractId, ContractRequest request);

    void delete(Long contractId);

    ContractResponse getById(Long contractId);

    List<ContractResponse> getByStaffId(Long staffId);
}
