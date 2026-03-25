package fpt.teddypet.application.dto.response.user;

import lombok.Builder;
import java.util.UUID;

@Builder
public record UserAddressResponse(
        Long id,
        UUID userId,
        String fullName,
        String phone,
        String address,
        Double longitude,
        Double latitude,
        boolean isDefault) {
}
