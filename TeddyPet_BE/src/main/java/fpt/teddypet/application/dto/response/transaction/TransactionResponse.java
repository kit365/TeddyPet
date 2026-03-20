package fpt.teddypet.application.dto.response.transaction;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionResponse {
    private String id;
    private String referenceCode; // Order Code or Booking ID
    private BigDecimal amount;
    private String paymentMethod;
    private String status;
    private String type; // "ORDER", "BOOKING_DEPOSIT", "BOOKING_FINAL"
    private LocalDateTime createdAt;
    private String description;
    private String customerName;
    private String accountNumbers; // For bank transfers
}
