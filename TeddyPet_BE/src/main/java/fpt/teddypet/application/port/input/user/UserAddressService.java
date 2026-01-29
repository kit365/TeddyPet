package fpt.teddypet.application.port.input.user;

import fpt.teddypet.application.dto.request.user.UserAddressRequest;
import fpt.teddypet.application.dto.response.user.UserAddressResponse;
import java.util.List;
import java.util.UUID;

public interface UserAddressService {
    void create(UUID userId, UserAddressRequest request);

    void update(Long addressId, UUID userId, UserAddressRequest request);

    void delete(Long addressId, UUID userId);

    UserAddressResponse getDetail(Long addressId, UUID userId);

    List<UserAddressResponse> getAllByUserId(UUID userId);

    void setDefault(Long addressId, UUID userId);
}
