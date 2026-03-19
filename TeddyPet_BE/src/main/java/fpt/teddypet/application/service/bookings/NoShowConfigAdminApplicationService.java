package fpt.teddypet.application.service.bookings;

import fpt.teddypet.application.dto.request.bookings.UpsertNoShowConfigRequest;
import fpt.teddypet.application.dto.response.bookings.NoShowConfigResponse;
import fpt.teddypet.application.port.input.bookings.NoShowConfigAdminService;
import fpt.teddypet.domain.entity.NoShowConfig;
import fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.NoShowConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NoShowConfigAdminApplicationService implements NoShowConfigAdminService {

    private final NoShowConfigRepository noShowConfigRepository;

    @Override
    public NoShowConfigResponse getCurrent() {
        return noShowConfigRepository.findActiveConfig()
                .map(this::toResponse)
                .orElse(null);
    }

    @Override
    @Transactional
    public NoShowConfigResponse upsert(UpsertNoShowConfigRequest request) {
        NoShowConfig entity = noShowConfigRepository.findActiveConfig()
                .orElseGet(() -> NoShowConfig.builder()
                        .gracePeriodMinutes(15)
                        .autoMarkNoShow(true)
                        .forfeitDeposit(true)
                        .penaltyAmount(BigDecimal.ZERO)
                        .allowLateCheckin(false)
                        .lateCheckinMinutes(30)
                        .build());

        entity.setGracePeriodMinutes(request.gracePeriodMinutes());
        entity.setAutoMarkNoShow(request.autoMarkNoShow());
        entity.setForfeitDeposit(request.forfeitDeposit());
        entity.setPenaltyAmount(request.penaltyAmount());
        entity.setAllowLateCheckin(request.allowLateCheckin());
        entity.setLateCheckinMinutes(request.lateCheckinMinutes());
        entity.setActive(request.isActive() != null ? request.isActive() : true);

        NoShowConfig saved = noShowConfigRepository.save(entity);
        return toResponse(saved);
    }

    private NoShowConfigResponse toResponse(NoShowConfig c) {
        return new NoShowConfigResponse(
                c.getId(),
                c.getGracePeriodMinutes(),
                c.getAutoMarkNoShow(),
                c.getForfeitDeposit(),
                c.getPenaltyAmount(),
                c.getAllowLateCheckin(),
                c.getLateCheckinMinutes(),
                c.isActive(),
                c.getCreatedAt(),
                c.getUpdatedAt()
        );
    }
}

