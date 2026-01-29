package fpt.teddypet.application.port.output.user;

import fpt.teddypet.domain.entity.UserAddress;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserAddressRepositoryPort {
    UserAddress save(UserAddress userAddress);

    Optional<UserAddress> findById(Long id);

    List<UserAddress> findAllByUserId(UUID userId);

    void delete(UserAddress userAddress);

    Optional<UserAddress> findDefaultByUserId(UUID userId);

    void unsetDefaultAddress(UUID userId);
}
