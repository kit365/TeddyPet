package fpt.teddypet.domain.entity;

import fpt.teddypet.domain.enums.bookings.BookingTypeEnum;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "bookings")
@EqualsAndHashCode(callSuper = true)
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Booking extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "booking_code", nullable = false, unique = true, length = 50)
    private String bookingCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private User user;

    @Column(name = "customer_phone", length = 20)
    private String customerPhone;

    @Column(name = "customer_email", length = 255)
    private String customerEmail;

    @Column(name = "customer_name", length = 255)
    private String customerName;

    @Enumerated(EnumType.STRING)
    @Column(name = "booking_type", length = 50)
    private BookingTypeEnum bookingType;

    @Column(name = "total_amount", precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "paid_amount", precision = 12, scale = 2)
    private BigDecimal paidAmount;

    @Column(name = "payment_status", length = 50)
    private String paymentStatus;

    @Column(name = "payment_method", columnDefinition = "TEXT")
    private String paymentMethod; // JSON array of methods, e.g. ["CASH","BANK_TRANSFER"]

    @Column(name = "status", length = 50)
    private String status;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

    @Column(name = "internal_notes", columnDefinition = "TEXT")
    private String internalNotes;

    @Column(name = "special_requests", columnDefinition = "TEXT")
    private String specialRequests;


    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "cancelled_by", length = 100)
    private String cancelledBy;

    @Column(name = "refund_amount", precision = 12, scale = 2)
    private BigDecimal refundAmount;

    @Column(name = "refund_method", length = 50)
    private String refundMethod;

    @Column(name = "confirm_at")
    private LocalDateTime confirmAt;

    @Column(name = "confirm_by", length = 100)
    private String confirmBy;

    @Column(name = "remaining_amount", precision = 12, scale = 2)
    private BigDecimal remainingAmount;

    @Column(name = "credit_to_refund", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal creditToRefund = BigDecimal.ZERO;

    @Column(name = "is_temporary", nullable = false)
    @Builder.Default
    private Boolean isTemporary = false;

    @Column(name = "cancelled_reason", columnDefinition = "TEXT")
    private String cancelledReason;

    @Column(name = "cancel_requested", nullable = false)
    @Builder.Default
    private Boolean cancelRequested = false;

    @Column(name = "booking_check_in_date")
    private LocalDateTime bookingCheckInDate;

    @Column(name = "booking_check_out_date")
    private LocalDateTime bookingCheckOutDate;

    /**
     * Ngày gửi (khách chọn khi tạo booking) – dùng để hiển thị danh sách,
     * không ghi đè bởi luồng staff Check-in/Check-out.
     */
    @Column(name = "booking_date_from")
    private LocalDate bookingDateFrom;

    @OneToMany(mappedBy = "booking", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<BookingPet> pets = new ArrayList<>();
}
