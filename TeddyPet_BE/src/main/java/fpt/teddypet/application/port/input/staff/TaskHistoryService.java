package fpt.teddypet.application.port.input.staff;

import fpt.teddypet.application.dto.request.staff.TaskHistoryRequest;
import fpt.teddypet.application.dto.response.staff.TaskHistoryResponse;

import java.time.LocalDate;
import java.util.List;

public interface TaskHistoryService {

    TaskHistoryResponse create(TaskHistoryRequest request);

    List<TaskHistoryResponse> getByStaffAndDateRange(Long staffId, LocalDate from, LocalDate to);
}

