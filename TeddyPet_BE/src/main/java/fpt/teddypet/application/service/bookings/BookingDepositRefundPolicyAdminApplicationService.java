package fpt.teddypet.application.service.bookings;

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

