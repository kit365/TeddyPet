package fpt.teddypet.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;

/**
 * Quản lý các ngoại lệ ảnh hưởng tới time slots.
 * serviceId = null: scope Store (áp dụng toàn cửa hàng, VD: ngày nghỉ).
 * serviceId != null: scope Service (áp dụng riêng dịch vụ đó).
 */
@Entity
@Table(name = "time_slot_exceptions")
@EqualsAndHashCode(callSuper = true)
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class TimeSlotException extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Null = Store scope, non-null = Service scope */
    @Column(name = "service_id")
    private Long serviceId;

    @Column(name = "time_exception_name", nullable = false, length = 255)
    private String timeExceptionName;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "scope", length = 50)
    private String scope; // STORE, SERVICE

    @Column(name = "exception_type", length = 50)
    private String exceptionType; // Holiday, Special Event, Maintenance, ...

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    @Column(name = "is_recurring", nullable = false)
    @Builder.Default
    private Boolean isRecurring = false;

    @Column(name = "recurrence_pattern", length = 50)
    private String recurrencePattern; // YEARLY, MONTHLY
}
