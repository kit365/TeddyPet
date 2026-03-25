package fpt.teddypet.application.service.bookings;

import fpt.teddypet.application.dto.request.bookings.UpsertBookingDepositRefundPolicyRequest;
import fpt.teddypet.application.dto.response.bookings.BookingDepositRefundPolicyResponse;
import fpt.teddypet.application.port.input.bookings.BookingDepositRefundPolicyAdminService;
import fpt.teddypet.domain.entity.BookingDepositRefundPolicy;
import fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.BookingDepositRefundPolicyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BookingDepositRefundPolicyAdminApplicationService implements BookingDepositRefundPolicyAdminService {

    private final BookingDepositRefundPolicyRepository bookingDepositRefundPolicyRepository;

    @Override
    public List<BookingDepositRefundPolicyResponse> getAll() {
        return bookingDepositRefundPolicyRepository.findAllNotDeletedOrderByDisplayOrder()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public BookingDepositRefundPolicyResponse create(UpsertBookingDepositRefundPolicyRequest request) {
        BookingDepositRefundPolicy entity = new BookingDepositRefundPolicy();
        applyUpsert(entity, request);
        // Nếu set mặc định, clear mặc định cũ (chỉ 1 bản ghi isDefault=true)
        if (Boolean.TRUE.equals(request.isDefault())) {
            bookingDepositRefundPolicyRepository.findAllNotDeletedOrderByDisplayOrder()
                    .forEach(p -> {
                        if (Boolean.TRUE.equals(p.getIsDefault())) {
                            p.setIsDefault(false);
                        }
                    });
            // Bản ghi mặc định luôn phải đang hoạt động
            entity.setActive(true);
        }
        BookingDepositRefundPolicy saved = bookingDepositRefundPolicyRepository.save(entity);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public BookingDepositRefundPolicyResponse update(Long id, UpsertBookingDepositRefundPolicyRequest request) {
        BookingDepositRefundPolicy entity = bookingDepositRefundPolicyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy chính sách hoàn cọc với id: " + id));
        applyUpsert(entity, request);
        if (Boolean.TRUE.equals(request.isDefault())) {
            bookingDepositRefundPolicyRepository.findAllNotDeletedOrderByDisplayOrder()
                    .forEach(p -> {
                        if (!p.getId().equals(entity.getId()) && Boolean.TRUE.equals(p.getIsDefault())) {
                            p.setIsDefault(false);
                        }
                    });
            // Bản ghi mặc định luôn phải đang hoạt động
            entity.setActive(true);
        }
        BookingDepositRefundPolicy saved = bookingDepositRefundPolicyRepository.save(entity);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        BookingDepositRefundPolicy entity = bookingDepositRefundPolicyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy chính sách hoàn cọc với id: " + id));
        entity.setDeleted(true);
        entity.setActive(false);
        bookingDepositRefundPolicyRepository.save(entity);
    }

    private void applyUpsert(BookingDepositRefundPolicy entity, UpsertBookingDepositRefundPolicyRequest r) {
        entity.setPolicyName(r.policyName().trim());
        entity.setDescription(r.description());
        entity.setDepositPercentage(r.depositPercentage());
        entity.setFullRefundHours(r.fullRefundHours());
        entity.setFullRefundPercentage(r.fullRefundPercentage());
        entity.setPartialRefundHours(r.partialRefundHours());
        entity.setPartialRefundPercentage(r.partialRefundPercentage());
        entity.setNoRefundHours(r.noRefundHours());
        entity.setNoRefundPercentage(r.noRefundPercentage());
        entity.setNoShowRefundPercentage(r.noShowRefundPercentage());
        entity.setNoShowPenalty(r.noShowPenalty());
        entity.setAllowForceMajeure(r.allowForceMajeure());
        entity.setForceMajeureRefundPercentage(r.forceMajeureRefundPercentage());
        entity.setForceMajeureRequiresEvidence(r.forceMajeureRequiresEvidence());
        entity.setIsDefault(r.isDefault());
        entity.setDisplayOrder(r.displayOrder() != null ? r.displayOrder() : 0);
        entity.setHighlightText(r.highlightText());
        entity.setActive(r.isActive());
    }

    private BookingDepositRefundPolicyResponse toResponse(BookingDepositRefundPolicy p) {
        return new BookingDepositRefundPolicyResponse(
                p.getId(),
                p.getPolicyName(),
                p.getDescription(),
                p.getDepositPercentage(),
                p.getFullRefundHours(),
                p.getFullRefundPercentage(),
                p.getPartialRefundHours(),
                p.getPartialRefundPercentage(),
                p.getNoRefundHours(),
                p.getNoRefundPercentage(),
                p.getNoShowRefundPercentage(),
                p.getNoShowPenalty(),
                p.getAllowForceMajeure(),
                p.getForceMajeureRefundPercentage(),
                p.getForceMajeureRequiresEvidence(),
                p.getIsDefault(),
                p.getDisplayOrder(),
                p.getHighlightText(),
                p.isActive(),
                p.getCreatedAt(),
                p.getUpdatedAt());
    }
}

