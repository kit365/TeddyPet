package fpt.teddypet.application.port.input.staff;

import fpt.teddypet.application.dto.request.staff.StaffSkillRequest;
import fpt.teddypet.application.dto.response.staff.StaffSkillResponse;

import java.util.List;

public interface StaffSkillService {

    StaffSkillResponse create(StaffSkillRequest request);

    StaffSkillResponse update(Long id, StaffSkillRequest request);

    void delete(Long id);

    StaffSkillResponse getById(Long id);

    List<StaffSkillResponse> getByStaffId(Long staffId);
}

