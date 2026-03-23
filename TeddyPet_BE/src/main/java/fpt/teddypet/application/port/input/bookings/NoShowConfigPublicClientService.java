package fpt.teddypet.application.port.input.bookings;

import fpt.teddypet.application.dto.response.bookings.NoShowPublicClientResponse;

import java.util.Optional;

public interface NoShowConfigPublicClientService {

    /**
     * Trả về cấu hình no-show đang hoạt động gắn với dịch vụ (nếu có).
     */
    Optional<NoShowPublicClientResponse> getActiveByServiceId(Long serviceId);
}
