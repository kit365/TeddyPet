package fpt.teddypet.domain.entity;

import fpt.teddypet.domain.enums.scheduling.DayTypeEnum;
import fpt.teddypet.domain.enums.scheduling.SlotTypeEnum;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalTime;

/**
 * Template slot cho từng dịch vụ: loại ngày (WEEKDAY/WEEKEND/HOLIDAY), giờ bắt đầu/kết thúc, capacity, slot type.
 */
@Entity
@Table(name = "time_slots")
@EqualsAndHashCode(callSuper = true)
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class TimeSlot extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Service service;

    @Enumerated(EnumType.STRING)
    @Column(name = "day_type", nullable = false, length = 20)
    private DayTypeEnum dayType;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Column(name = "max_capacity", nullable = false)
    @Builder.Default
    private Integer maxCapacity = 1;

    @Column(name = "current_bookings")
    @Builder.Default
    private Integer currentBookings = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "slot_type", length = 20)
    @Builder.Default
    private SlotTypeEnum slotType = SlotTypeEnum.REGULAR;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "status", length = 50)
    @Builder.Default
    private String status = "ACTIVE";

    @Version
    private Long version;
}
