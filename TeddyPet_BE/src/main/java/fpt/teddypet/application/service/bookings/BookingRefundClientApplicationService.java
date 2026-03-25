package fpt.teddypet.application.service.bookings;

import fpt.teddypet.application.dto.request.bookings.BookingRefundRequest;
import fpt.teddypet.application.dto.response.bookings.BookingRefundResponse;
import fpt.teddypet.application.util.SecurityUtil;
import fpt.teddypet.domain.entity.Booking;
import fpt.teddypet.domain.entity.BookingRefund;
import fpt.teddypet.domain.enums.bookings.BookingTypeEnum;
import fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.BookingRefundRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.BookingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BookingRefundClientApplicationService {

    private final BookingRefundRepository bookingRefundRepository;
    private final BookingRepository bookingRepository;

    @Transactional
    public BookingRefundResponse createRefundRequest(Long bookingId, BookingRefundRequest request) {
        UUID userId = SecurityUtil.getCurrentUserId();
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalStateException("Booking not found with ID: " + bookingId));

        if (booking.getBookingType() == BookingTypeEnum.WALK_IN) {
            throw new IllegalStateException("Đặt lịch tại quầy không hỗ trợ yêu cầu hoàn tiền.");
        }

        if (!booking.getUser().getId().equals(userId)) {
            throw new IllegalStateException("You are not authorized to request refund for this booking.");
        }

        if (!"PENDING".equals(booking.getStatus()) && !"CONFIRMED".equals(booking.getStatus())) {
            throw new IllegalStateException("Cannot request refund for this booking status");
        }

        if (booking.getPaidAmount() == null || booking.getPaidAmount().compareTo(java.math.BigDecimal.ZERO) <= 0) {
            throw new IllegalStateException("This booking has not been paid");
        }

        List<BookingRefund> existingRefunds = bookingRefundRepository.findByBookingIdOrderByCreatedAtDesc(bookingId);
        if (existingRefunds.stream().anyMatch(r ->
                "PENDING".equalsIgnoreCase(r.getStatus()) ||
                "APPROVED".equalsIgnoreCase(r.getStatus()) ||
                "REFUNDED".equalsIgnoreCase(r.getStatus()))) {
            throw new IllegalStateException("A refund request is already pending, approved, or refunded for this booking");
        }

        booking.setCancelRequested(true);
        booking.setCancelledReason(request.reason());

        BookingRefund refund = BookingRefund.builder()
                .booking(booking)
                .requestedAmount(request.requestedAmount() != null ? request.requestedAmount() : booking.getPaidAmount())
                .currency("VND")
                .bankInformationId(request.bankInformationId())
                .customerReason(request.reason())
                .evidenceUrls(request.evidenceUrls() != null ? String.join(",", request.evidenceUrls()) : null)
                .status("PENDING")
                .build();

        BookingRefund saved = bookingRefundRepository.save(refund);
        bookingRepository.save(booking);

        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<BookingRefundResponse> getMyRefundRequests(Long bookingId) {
        UUID customerId = SecurityUtil.getCurrentUserId();

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalStateException("Booking not found"));

        if (!booking.getUser().getId().equals(customerId)) {
            throw new IllegalStateException("You are not authorized to request refund for this booking");
        }

        return bookingRefundRepository.findByBookingIdOrderByCreatedAtDesc(bookingId).stream()
                .map(this::mapToResponse)
                .toList();
    }

    /**
     * Tra cứu lịch sử hoàn tiền theo mã đặt lịch — public (cùng mức bảo mật với GET /api/bookings/code/{code}).
     * Khách không đăng nhập vẫn xem được nếu đang mở trang chi tiết đơn qua mã.
     */
    @Transactional(readOnly = true)
    public List<BookingRefundResponse> listRefundsByBookingCodePublic(String bookingCode) {
        Booking booking = bookingRepository.findByBookingCode(bookingCode)
                .orElseThrow(() -> new IllegalStateException("Booking not found"));
        return bookingRefundRepository.findByBookingIdOrderByCreatedAtDesc(booking.getId()).stream()
                .map(this::mapToResponse)
                .toList();
    }

    private BookingRefundResponse mapToResponse(BookingRefund refund) {
        return new BookingRefundResponse(
                refund.getId(),
                refund.getStatus(),
                refund.getRequestedAmount(),
                refund.getCurrency(),
                refund.getCustomerReason(),
                refund.getEvidenceUrls(),
                refund.getAdminDecisionNote(),
                refund.getProcessedBy(),
                refund.getRefundTransactionId(),
                refund.getAdminEvidenceUrls() != null
                        ? new ArrayList<>(refund.getAdminEvidenceUrls())
                        : List.of(),
                refund.getCreatedAt(),
                refund.getProcessedAt(),
                refund.getRefundCompletedAt()
        );
    }
}
