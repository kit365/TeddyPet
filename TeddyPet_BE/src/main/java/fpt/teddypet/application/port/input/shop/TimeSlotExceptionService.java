package fpt.teddypet.application.port.input.shop;

import fpt.teddypet.application.dto.request.shop.TimeSlotExceptionUpsertRequest;
import fpt.teddypet.application.dto.response.shop.TimeSlotExceptionResponse;

import java.util.List;

public interface TimeSlotExceptionService {

    List<TimeSlotExceptionResponse> getAll();

    List<TimeSlotExceptionResponse> getByServiceId(Long serviceId);

    TimeSlotExceptionResponse getById(Long id);

    void upsert(TimeSlotExceptionUpsertRequest request);

    void delete(Long id);
}
