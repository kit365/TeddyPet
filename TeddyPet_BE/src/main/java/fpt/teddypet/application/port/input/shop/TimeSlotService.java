package fpt.teddypet.application.port.input.shop;

import fpt.teddypet.application.dto.request.shop.TimeSlotUpsertRequest;
import fpt.teddypet.application.dto.response.shop.TimeSlotResponse;

import java.util.List;

public interface TimeSlotService {

    List<TimeSlotResponse> getByServiceId(Long serviceId);

    TimeSlotResponse getById(Long id);

    void upsert(TimeSlotUpsertRequest request);

    void delete(Long id);
}
