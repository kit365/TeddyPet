package fpt.teddypet.application.service.transaction;

import fpt.teddypet.application.dto.response.transaction.TransactionResponse;
import fpt.teddypet.domain.entity.BookingPaymentTransaction;
import fpt.teddypet.domain.entity.Payment;
import fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.BookingPaymentTransactionRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.payment.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TransactionService {

    private final PaymentRepository paymentRepository;
    private final BookingPaymentTransactionRepository bookingPaymentTransactionRepository;

    public List<TransactionResponse> getAllTransactions(
            LocalDateTime startDate,
            LocalDateTime endDate,
            String status,
            String method
    ) {
        List<TransactionResponse> transactions = new ArrayList<>();

        // 1. Fetch Order Payments
        List<Payment> orderPayments = paymentRepository.findAll();
        transactions.addAll(orderPayments.stream()
                .filter(p -> isWithinRange(p.getCreatedAt(), startDate, endDate))
                .filter(p -> status == null || p.getStatus().name().equalsIgnoreCase(status))
                .filter(p -> method == null || p.getPaymentMethod().name().equalsIgnoreCase(method))
                .map(this::mapToOrderTransaction)
                .collect(Collectors.toList()));

        // 2. Fetch Booking Transactions
        List<BookingPaymentTransaction> bookingTransactions = bookingPaymentTransactionRepository.findAll();
        transactions.addAll(bookingTransactions.stream()
                .filter(t -> isWithinRange(t.getPaidAt(), startDate, endDate))
                .filter(t -> status == null || t.getStatus().equalsIgnoreCase(status))
                .filter(t -> method == null || t.getPaymentMethod().equalsIgnoreCase(method))
                .map(this::mapToBookingTransaction)
                .collect(Collectors.toList()));

        // 3. Sort by created date desc
        return transactions.stream()
                .sorted(Comparator.comparing(TransactionResponse::getCreatedAt).reversed())
                .collect(Collectors.toList());
    }

    private boolean isWithinRange(LocalDateTime date, LocalDateTime start, LocalDateTime end) {
        if (date == null) return false;
        if (start != null && date.isBefore(start)) return false;
        if (end != null && date.isAfter(end)) return false;
        return true;
    }

    private TransactionResponse mapToOrderTransaction(Payment p) {
        return TransactionResponse.builder()
                .id(p.getId().toString())
                .referenceCode(p.getOrder() != null ? p.getOrder().getOrderCode() : "N/A")
                .amount(p.getAmount())
                .paymentMethod(p.getPaymentMethod().name())
                .status(p.getStatus().name())
                .type("ORDER")
                .createdAt(p.getCreatedAt())
                .description(p.getNotes())
                .customerName(p.getOrder() != null && p.getOrder().getUser() != null 
                    ? p.getOrder().getUser().getFirstName() + " " + p.getOrder().getUser().getLastName() 
                    : "Guest")
                .build();
    }

    private TransactionResponse mapToBookingTransaction(BookingPaymentTransaction t) {
        return TransactionResponse.builder()
                .id(t.getId().toString())
                .referenceCode("BK-" + t.getBookingId())
                .amount(t.getAmount())
                .paymentMethod(t.getPaymentMethod())
                .status(t.getStatus())
                .type("BOOKING")
                .createdAt(t.getPaidAt())
                .description(t.getNote())
                .customerName(t.getPaidByName() != null ? t.getPaidByName() : "Guest")
                .accountNumbers(t.getTransactionReference())
                .build();
    }
}
