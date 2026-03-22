package fpt.teddypet.application.dto.response.staff;

import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeTaskResponse {
    private Long id;
    /** CARE = dịch vụ phòng; SPA = dịch vụ không phòng / combo spa. */
    private String type;
    private String title;
    private String description;
    private String status;
    private LocalDateTime createdAt;

    /** Mã booking (hiển thị trên dashboard nhân viên). */
    private String bookingCode;
    private String customerName;

    private String cageNumber;
    private String petName;
    private String petSpecies;
    private String notes;

    /**
     * Với type=SPA: SHOWER | HAIRCUT | NAIL | COMBO (khớp FE SpaTask).
     * Với type=CARE: có thể null hoặc ROOM.
     */
    private String serviceType;
    private LocalDateTime bookingTime;
    private Integer durationMinutes;
    
    private LocalDateTime scheduledStart;
    private LocalDateTime scheduledEnd;
    private LocalDateTime startedAt;
    private LocalDateTime finishedAt;
}
