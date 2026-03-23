package fpt.teddypet.application.port.input.bookings;

import fpt.teddypet.application.dto.request.bookings.SetNoShowConfigServicesRequest;
import fpt.teddypet.application.dto.request.bookings.UpsertNoShowConfigRequest;
import fpt.teddypet.application.dto.response.bookings.NoShowConfigResponse;

import java.util.List;

public interface NoShowConfigAdminService {

    List<NoShowConfigResponse> listAll();

    NoShowConfigResponse getById(Long id);

    NoShowConfigResponse create(UpsertNoShowConfigRequest request);

    NoShowConfigResponse update(Long id, UpsertNoShowConfigRequest request);

    void delete(Long id);

    NoShowConfigResponse replaceServices(Long id, SetNoShowConfigServicesRequest request);
}
