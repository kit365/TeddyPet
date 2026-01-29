package fpt.teddypet.application.service.user;

import fpt.teddypet.application.dto.request.user.UserAddressRequest;
import fpt.teddypet.application.dto.response.user.UserAddressResponse;
import fpt.teddypet.application.mapper.user.UserAddressMapper;
import fpt.teddypet.application.port.input.user.UserAddressService;
import fpt.teddypet.application.port.output.UserRepositoryPort;
import fpt.teddypet.application.port.output.user.UserAddressRepositoryPort;
import fpt.teddypet.domain.entity.User;
import fpt.teddypet.domain.entity.UserAddress;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserAddressApplicationService implements UserAddressService {

    private final UserAddressRepositoryPort userAddressRepositoryPort;
    private final UserRepositoryPort userRepositoryPort;
    private final UserAddressMapper userAddressMapper;

    @Override
    @Transactional
    public void create(UUID userId, UserAddressRequest request) {
        User user = userRepositoryPort.getById(userId);

        if (request.isDefault()) {
            userAddressRepositoryPort.unsetDefaultAddress(userId);
        }

        UserAddress address = userAddressMapper.toEntity(request);
        address.setUser(user);

        // If it's the first address, set it as default
        List<UserAddress> existingAddresses = userAddressRepositoryPort.findAllByUserId(userId);
        if (existingAddresses.isEmpty()) {
            address.setDefaultAddress(true);
        }

        userAddressRepositoryPort.save(address);
    }

    @Override
    @Transactional
    public void update(Long addressId, UUID userId, UserAddressRequest request) {
        UserAddress address = getByIdAndUserId(addressId, userId);

        if (request.isDefault() && !Boolean.TRUE.equals(address.getDefaultAddress())) {
            userAddressRepositoryPort.unsetDefaultAddress(userId);
        }

        userAddressMapper.updateEntityFromRequest(request, address);
        userAddressRepositoryPort.save(address);
    }

    @Override
    @Transactional
    public void delete(Long addressId, UUID userId) {
        UserAddress address = getByIdAndUserId(addressId, userId);
        userAddressRepositoryPort.delete(address);
    }

    @Override
    public UserAddressResponse getDetail(Long addressId, UUID userId) {
        return userAddressMapper.toResponse(getByIdAndUserId(addressId, userId));
    }

    @Override
    public List<UserAddressResponse> getAllByUserId(UUID userId) {
        return userAddressRepositoryPort.findAllByUserId(userId).stream()
                .map(userAddressMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void setDefault(Long addressId, UUID userId) {
        UserAddress address = getByIdAndUserId(addressId, userId);
        if (!Boolean.TRUE.equals(address.getDefaultAddress())) {
            userAddressRepositoryPort.unsetDefaultAddress(userId);
            address.setDefaultAddress(true);
            userAddressRepositoryPort.save(address);
        }
    }

    private UserAddress getByIdAndUserId(Long addressId, UUID userId) {
        UserAddress address = userAddressRepositoryPort.findById(addressId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy địa chỉ"));

        if (!address.getUser().getId().equals(userId)) {
            throw new EntityNotFoundException("Địa chỉ không thuộc về người dùng này");
        }
        return address;
    }
}
