package fpt.teddypet.infrastructure.adapter.user;

import fpt.teddypet.application.port.output.user.UserAddressRepositoryPort;
import fpt.teddypet.domain.entity.UserAddress;
import fpt.teddypet.infrastructure.persistence.postgres.repository.user.UserAddressRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class UserAddressRepositoryAdapter implements UserAddressRepositoryPort {

    private final UserAddressRepository userAddressRepository;

    @Override
    public UserAddress save(UserAddress userAddress) {
        return userAddressRepository.save(userAddress);
    }

    @Override
    public Optional<UserAddress> findById(Long id) {
        return userAddressRepository.findById(id);
    }

    @Override
    public List<UserAddress> findAllByUserId(UUID userId) {
        return userAddressRepository.findAllByUserId(userId);
    }

    @Override
    public void delete(UserAddress userAddress) {
        userAddressRepository.delete(userAddress);
    }

    @Override
    public Optional<UserAddress> findDefaultByUserId(UUID userId) {
        return userAddressRepository.findByUserIdAndDefaultAddressTrue(userId);
    }

    @Override
    public void unsetDefaultAddress(UUID userId) {
        userAddressRepository.unsetDefaultAddress(userId);
    }
}
