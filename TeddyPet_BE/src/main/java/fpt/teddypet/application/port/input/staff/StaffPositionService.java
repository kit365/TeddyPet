package fpt.teddypet.application.port.input.staff;

import fpt.teddypet.application.dto.request.staff.StaffPositionRequest;
import fpt.teddypet.application.dto.response.staff.StaffPositionResponse;

import java.util.List;

public interface StaffPositionService {

    StaffPositionResponse create(StaffPositionRequest request);

    StaffPositionResponse update(Long id, StaffPositionRequest request);

    void delete(Long id);

    StaffPositionResponse getById(Long id);

    List<StaffPositionResponse> getAllActive();
}
