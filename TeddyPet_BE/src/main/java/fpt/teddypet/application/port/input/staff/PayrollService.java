package fpt.teddypet.application.port.input.staff;

import fpt.teddypet.application.dto.request.staff.PayrollRunRequest;
import fpt.teddypet.application.dto.response.staff.SalaryLogResponse;

import java.util.List;

public interface PayrollService {

    List<SalaryLogResponse> runPayroll(PayrollRunRequest request);

    List<SalaryLogResponse> getByMonthYear(Integer month, Integer year, Long staffId);
}

