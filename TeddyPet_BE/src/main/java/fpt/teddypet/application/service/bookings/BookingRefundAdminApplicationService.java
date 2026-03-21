package fpt.teddypet.application.service.bookings;

import fpt.teddypet.application.dto.request.bookings.AdminHandleBookingRefundRequest;
import fpt.teddypet.application.dto.response.bookings.BookingRefundResponse;
import fpt.teddypet.application.port.output.EmailServicePort;
import fpt.teddypet.application.service.dashboard.DashboardService;
import fpt.teddypet.application.util.SecurityUtil;
import fpt.teddypet.domain.entity.Booking;
import fpt.teddypet.domain.entity.BookingPaymentTransaction;
import fpt.teddypet.domain.entity.BookingRefund;
import fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.BookingPaymentTransactionRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.BookingDepositRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.BookingRefundRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.BookingRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.TimeSlotBookingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookingRefundAdminApplicationService {

    private final BookingRefundRepository bookingRefundRepository;
    private final BookingRepository bookingRepository;
    private final EmailServicePort emailServicePort;
    private final BookingDepositRepository bookingDepositRepository;
    private final BookingPaymentTransactionRepository bookingPaymentTransactionRepository;
    private final TimeSlotBookingRepository timeSlotBookingRepository;
    private final DashboardService dashboardService;

    @Transactional
    public BookingRefundResponse handleRefundRequest(Long refundId, AdminHandleBookingRefundRequest request) {
        UUID adminId = SecurityUtil.getCurrentUserId();

        BookingRefund refund = bookingRefundRepository.findById(refundId)
                .orElseThrow(() -> new IllegalStateException("Refund request not found"));

        if (!"PENDING".equals(refund.getStatus())) {
            throw new IllegalStateException("This refund request has already been handled");
        }

        Booking booking = refund.getBooking();

        if (Boolean.TRUE.equals(request.approved())) {
            refund.setStatus("REFUNDED");
            refund.setRefundTransactionId(request.refundTransactionId());
            if (request.adminEvidenceUrls() != null) {
                refund.setAdminEvidenceUrls(request.adminEvidenceUrls());
            }
            refund.setRefundCompletedAt(LocalDateTime.now());
            
            booking.setStatus("CANCELLED");
            booking.setCancelledAt(LocalDateTime.now());
            booking.setCancelledBy(adminId != null ? adminId.toString() : "ADMIN");
            booking.setRefundAmount(refund.getRequestedAmount());
            booking.setRefundMethod("BANK_TRANSFER");
            booking.setCancelRequested(false);

            // Duyệt hoàn tiền: hủy toàn bộ pets/services liên quan để đồng bộ với booking CANCELLED.
            for (var pet : booking.getPets()) {
                pet.setStatus("CANCELLED");
                for (var svc : pet.getServices()) {
                    svc.setStatus("CANCELLED");
                }
            }
            bookingDepositRepository.findByBookingId(booking.getId()).forEach(deposit -> {
                if ("PENDING".equalsIgnoreCase(deposit.getStatus())) {
                    deposit.setStatus("CANCELLED");
                    bookingDepositRepository.save(deposit);
                }
            });
            timeSlotBookingRepository.deleteByBookingPetService_Booking_Id(booking.getId());

            // Tạo bản ghi lịch sử giao dịch cho nghiệp vụ hoàn cọc
            BookingPaymentTransaction refundTx = BookingPaymentTransaction.builder()
                    .bookingId(booking.getId())
                    .transactionType("REFUND")
                    .amount(refund.getRequestedAmount())
                    .paymentMethod("BANK_TRANSFER")
                    .transactionReference(request.refundTransactionId())
                    .paidByName(booking.getCustomerName())
                    .paidAt(LocalDateTime.now())
                    .receivedBy(adminId)
                    .status("COMPLETED")
                    .note("Hoàn lại tiền đặt cọc")
                    .build();
            bookingPaymentTransactionRepository.save(refundTx);
        } else {
            refund.setStatus("REJECTED");
            booking.setCancelRequested(false);
            // Từ chối: không lưu bằng chứng hoàn tiền (chỉ dùng khi phê duyệt); xóa nếu client gửi kèm.
            refund.setAdminEvidenceUrls(new ArrayList<>());
        }

        refund.setAdminDecisionNote(request.adminNote());
        refund.setProcessedBy(adminId != null ? adminId.toString() : "ADMIN");
        refund.setProcessedAt(LocalDateTime.now());

        BookingRefund saved = bookingRefundRepository.save(refund);
        bookingRepository.save(booking);
        dashboardService.sendDashboardUpdate();

        notifyCustomerRefundDecision(booking, saved, Boolean.TRUE.equals(request.approved()), request.adminNote());

        return mapToResponse(saved);
    }

    private void notifyCustomerRefundDecision(Booking booking, BookingRefund refund, boolean approved, String adminNote) {
        String to = resolveCustomerEmail(booking);
        if (to == null || to.isBlank()) {
            log.warn("Skip refund decision email: no customer email for booking {}", booking.getBookingCode());
            return;
        }
        try {
            String note = adminNote != null ? adminNote.trim() : "";
            if (approved) {
                String refundAmountFormatted = String.format("%,.0f VND", refund.getRequestedAmount());
                emailServicePort.sendBookingRefundApprovedEmail(to, booking.getBookingCode(), refundAmountFormatted, note.isEmpty() ? null : note);
            } else {
                emailServicePort.sendBookingRefundRejectedEmail(to, booking.getBookingCode(), note.isEmpty() ? null : note);
            }
        } catch (Exception e) {
            log.error("Failed to send refund decision email for booking {}: {}", booking.getBookingCode(), e.getMessage());
        }
    }

    private static String resolveCustomerEmail(Booking booking) {
        if (booking.getCustomerEmail() != null && !booking.getCustomerEmail().isBlank()) {
            return booking.getCustomerEmail().trim();
        }
        if (booking.getUser() != null && booking.getUser().getEmail() != null && !booking.getUser().getEmail().isBlank()) {
            return booking.getUser().getEmail().trim();
        }
        return null;
    }
    
    @Transactional
    public List<BookingRefundResponse> getAllForBooking(Long bookingId) {
        List<BookingRefund> history = bookingRefundRepository.findByBookingIdOrderByCreatedAtDesc(bookingId);

        // Backfill cho dữ liệu cũ: booking đã gửi yêu cầu hủy/hoàn nhưng chưa có row trong booking_refunds.
        if (history.isEmpty()) {
            Booking booking = bookingRepository.findById(bookingId)
                    .orElseThrow(() -> new IllegalStateException("Booking not found"));
            if (Boolean.TRUE.equals(booking.getCancelRequested())
                    && booking.getRefundAmount() != null
                    && booking.getRefundAmount().compareTo(java.math.BigDecimal.ZERO) > 0) {
                BookingRefund pending = BookingRefund.builder()
                        .booking(booking)
                        .requestedAmount(booking.getRefundAmount())
                        .currency("VND")
                        .customerReason(
                                booking.getCancelledReason() != null && !booking.getCancelledReason().isBlank()
                                        ? booking.getCancelledReason().trim()
                                        : "Yêu cầu hoàn tiền")
                        .status("PENDING")
                        .build();
                bookingRefundRepository.save(pending);
                history = bookingRefundRepository.findByBookingIdOrderByCreatedAtDesc(bookingId);
            }
        }

        return history.stream()
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
