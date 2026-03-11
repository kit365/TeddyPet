package fpt.teddypet.application.service.bookings;

import fpt.teddypet.application.dto.response.bookings.BookingDepositRefundPolicyResponse;
import fpt.teddypet.application.port.input.bookings.BookingDepositRefundPolicyClientService;
import fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.BookingDepositRefundPolicyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BookingDepositRefundPolicyClientApplicationService implements BookingDepositRefundPolicyClientService {

    private final BookingDepositRefundPolicyRepository repository;

    @Override
    public List<BookingDepositRefundPolicyResponse> getAllActivePolicies() {
        return repository.findAllActivePolicies().stream()
                .map(p -> new BookingDepositRefundPolicyResponse(
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
                        p.getUpdatedAt()
                ))
                .collect(Collectors.toList());
    }
}
