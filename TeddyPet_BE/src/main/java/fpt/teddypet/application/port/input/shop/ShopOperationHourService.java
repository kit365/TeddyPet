package fpt.teddypet.application.port.input.shop;

import fpt.teddypet.application.dto.request.shop.ShopOperationHourUpsertRequest;
import fpt.teddypet.application.dto.response.shop.ShopOperationHourResponse;

import java.util.List;

public interface ShopOperationHourService {

    List<ShopOperationHourResponse> getAll();

    ShopOperationHourResponse getByDayOfWeek(Integer dayOfWeek);

    void upsert(ShopOperationHourUpsertRequest request);

    void upsertAll(List<ShopOperationHourUpsertRequest> requests);
}
