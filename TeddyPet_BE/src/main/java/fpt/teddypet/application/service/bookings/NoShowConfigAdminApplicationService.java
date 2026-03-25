package fpt.teddypet.application.service.bookings;

import fpt.teddypet.application.dto.request.bookings.SetNoShowConfigServicesRequest;
import fpt.teddypet.application.dto.request.bookings.UpsertNoShowConfigRequest;
import fpt.teddypet.application.dto.response.bookings.NoShowConfigResponse;
import fpt.teddypet.application.dto.response.bookings.NoShowServiceSummaryResponse;
import fpt.teddypet.application.port.input.bookings.NoShowConfigAdminService;
import fpt.teddypet.domain.entity.NoShowConfig;
import fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.NoShowConfigRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.services.ServiceRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NoShowConfigAdminApplicationService implements NoShowConfigAdminService {

    private final NoShowConfigRepository noShowConfigRepository;
    private final ServiceRepository serviceRepository;

    @Override
    public List<NoShowConfigResponse> listAll() {
        return noShowConfigRepository.findAllByIsDeletedFalseOrderByIdAsc().stream()
                .map(this::toListItem)
                .toList();
    }

    @Override
    public NoShowConfigResponse getById(Long id) {
        NoShowConfig c = noShowConfigRepository
                .findByIdWithServices(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cấu hình No-Show #" + id));
        return toDetailResponse(c);
    }

    @Override
    @Transactional
    public NoShowConfigResponse create(UpsertNoShowConfigRequest request) {
        NoShowConfig e = NoShowConfig.builder()
                .name(request.name().trim())
                .gracePeriodMinutes(request.gracePeriodMinutes())
                .autoMarkNoShow(request.autoMarkNoShow())
                .penaltyAmount(request.penaltyAmount())
                .allowLateCheckin(request.allowLateCheckin())
                .lateCheckinMinutes(request.lateCheckinMinutes())
                .build();
        e.setActive(request.isActive() != null ? request.isActive() : true);

        NoShowConfig saved = noShowConfigRepository.save(e);
        if (request.serviceIds() != null && !request.serviceIds().isEmpty()) {
            replaceServicesInternal(saved, request.serviceIds());
        }
        return getById(saved.getId());
    }

    @Override
    @Transactional
    public NoShowConfigResponse update(Long id, UpsertNoShowConfigRequest request) {
        NoShowConfig e = noShowConfigRepository
                .findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cấu hình No-Show #" + id));

        e.setName(request.name().trim());
        e.setGracePeriodMinutes(request.gracePeriodMinutes());
        e.setAutoMarkNoShow(request.autoMarkNoShow());
        e.setPenaltyAmount(request.penaltyAmount());
        e.setAllowLateCheckin(request.allowLateCheckin());
        e.setLateCheckinMinutes(request.lateCheckinMinutes());
        if (request.isActive() != null) {
            e.setActive(request.isActive());
        }

        if (request.serviceIds() != null) {
            replaceServicesInternal(e, request.serviceIds());
        }
        noShowConfigRepository.save(e);
        return getById(id);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        NoShowConfig e = noShowConfigRepository
                .findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cấu hình No-Show #" + id));
        List<fpt.teddypet.domain.entity.Service> assigned = serviceRepository.findByNoShowConfig_Id(id);
        for (fpt.teddypet.domain.entity.Service s : assigned) {
            s.setNoShowConfig(null);
            serviceRepository.save(s);
        }
        e.setDeleted(true);
        e.setActive(false);
        noShowConfigRepository.save(e);
    }

    @Override
    @Transactional
    public NoShowConfigResponse replaceServices(Long id, SetNoShowConfigServicesRequest request) {
        NoShowConfig e = noShowConfigRepository
                .findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cấu hình No-Show #" + id));
        replaceServicesInternal(e, request.serviceIds());
        noShowConfigRepository.save(e);
        return getById(id);
    }

    /**
     * Mỗi {@link Service} chỉ thuộc tối đa một {@link NoShowConfig} (FK trên services).
     * Dịch vụ đã gán cho cấu hình khác sẽ không gán được cho cấu hình này.
     */
    private void replaceServicesInternal(NoShowConfig config, List<Long> serviceIds) {
        Long configId = config.getId();
        if (configId == null) {
            throw new IllegalStateException("Cấu hình chưa có id.");
        }
        NoShowConfig ref = noShowConfigRepository.getReferenceById(configId);
        List<Long> distinctIds = serviceIds.stream().distinct().toList();
        Set<Long> newIds = new HashSet<>(distinctIds);

        List<fpt.teddypet.domain.entity.Service> currentlyAssigned = serviceRepository.findByNoShowConfig_Id(configId);
        for (fpt.teddypet.domain.entity.Service s : currentlyAssigned) {
            if (!newIds.contains(s.getId())) {
                s.setNoShowConfig(null);
                serviceRepository.save(s);
            }
        }

        for (Long sid : distinctIds) {
            fpt.teddypet.domain.entity.Service s = serviceRepository
                    .findById(sid)
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy dịch vụ #" + sid));
            if (s.isDeleted() || !s.isActive()) {
                throw new IllegalArgumentException("Dịch vụ không hợp lệ hoặc đã tắt: " + sid);
            }
            if (s.getNoShowConfig() != null && s.getNoShowConfig().getId().equals(configId)) {
                continue;
            }
            if (s.getNoShowConfig() != null) {
                throw new IllegalArgumentException(
                        "Dịch vụ \"" + s.getServiceName() + "\" đã được gán cho cấu hình No-Show khác.");
            }
            s.setNoShowConfig(ref);
            serviceRepository.save(s);
        }
    }

    private NoShowConfigResponse toListItem(NoShowConfig c) {
        int cnt = (int) serviceRepository.countByNoShowConfig_Id(c.getId());
        return new NoShowConfigResponse(
                c.getId(),
                c.getName(),
                c.getGracePeriodMinutes(),
                c.getAutoMarkNoShow(),
                c.getPenaltyAmount(),
                c.getAllowLateCheckin(),
                c.getLateCheckinMinutes(),
                c.isActive(),
                c.getCreatedAt(),
                c.getUpdatedAt(),
                List.of(),
                cnt);
    }

    private NoShowConfigResponse toDetailResponse(NoShowConfig c) {
        List<NoShowServiceSummaryResponse> services = c.getLinkedServices().stream()
                .filter(s -> !s.isDeleted())
                .sorted(Comparator.comparing(fpt.teddypet.domain.entity.Service::getId))
                .map(s -> new NoShowServiceSummaryResponse(s.getId(), s.getCode(), s.getServiceName()))
                .toList();
        return new NoShowConfigResponse(
                c.getId(),
                c.getName(),
                c.getGracePeriodMinutes(),
                c.getAutoMarkNoShow(),
                c.getPenaltyAmount(),
                c.getAllowLateCheckin(),
                c.getLateCheckinMinutes(),
                c.isActive(),
                c.getCreatedAt(),
                c.getUpdatedAt(),
                services,
                services.size());
    }
}
