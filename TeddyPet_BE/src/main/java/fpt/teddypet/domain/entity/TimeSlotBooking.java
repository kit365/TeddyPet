package fpt.teddypet.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Time slot booking trạng thái cho các dịch vụ có isRequiredRoom = false
 * Thay vì lưu timeSlotId trực tiếp trong booking_pet_services, 
 * ta tạo bản ghi trong bảng này để quản lý khung giờ đặt lịch
 */
@Entity
@Table(name = "time_slot_bookings")
@EqualsAndHashCode(callSuper = true)
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class TimeSlotBooking extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "time_slot_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private TimeSlot timeSlot;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Service service;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_pet_service_id", nullable = false, unique = true)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private BookingPetService bookingPetService;

    @Column(name = "booking_date", nullable = false)
    private LocalDate bookingDate;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Column(name = "max_capacity")
    private Integer maxCapacity;

    @Column(name = "status", length = 50)
    @Builder.Default
    private String status = "PENDING";
}
