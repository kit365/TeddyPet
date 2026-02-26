package fpt.teddypet.application.port.input.staff;

import fpt.teddypet.application.dto.request.staff.SkillRequest;
import fpt.teddypet.application.dto.response.staff.SkillResponse;

import java.util.List;

public interface SkillService {

    SkillResponse create(SkillRequest request);

    SkillResponse update(Long id, SkillRequest request);

    void delete(Long id);

    SkillResponse getById(Long id);

    List<SkillResponse> getAllActive();
}

