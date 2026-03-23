package fpt.teddypet.application.service.bookings;

import fpt.teddypet.application.dto.response.bookings.NoShowPublicClientResponse;
import fpt.teddypet.application.port.input.bookings.NoShowConfigPublicClientService;
import fpt.teddypet.domain.entity.NoShowConfig;
import fpt.teddypet.infrastructure.persistence.postgres.repository.services.ServiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NoShowConfigPublicClientApplicationService implements NoShowConfigPublicClientService {

    private final ServiceRepository serviceRepository;

    @Override
    public Optional<NoShowPublicClientResponse> getActiveByServiceId(Long serviceId) {
        if (serviceId == null) {
            return Optional.empty();
        }
        Optional<fpt.teddypet.domain.entity.Service> opt = serviceRepository.findById(serviceId);
        if (opt.isEmpty()) {
            return Optional.empty();
        }
        fpt.teddypet.domain.entity.Service s = opt.get();
        if (s.isDeleted() || !s.isActive()) {
            return Optional.empty();
        }
        NoShowConfig n = s.getNoShowConfig();
        if (n == null || n.isDeleted() || !n.isActive()) {
            return Optional.empty();
        }
        return Optional.of(new NoShowPublicClientResponse(
                n.getName(),
                n.getGracePeriodMinutes(),
                n.getAutoMarkNoShow(),
                n.getPenaltyAmount(),
                n.getAllowLateCheckin(),
                n.getLateCheckinMinutes()));
    }
}
