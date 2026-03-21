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
    private String type; // "CARE" or "SPA"
    private String title;
    private String description;
    private String status;
    private LocalDateTime createdAt;
    
    private String cageNumber;
    private String petName;
    private String petSpecies;
    private String notes;
    
    private String serviceType; // "SINGLE" or "COMBO"
    private LocalDateTime bookingTime;
    private Integer durationMinutes;
    
    private LocalDateTime scheduledStart;
    private LocalDateTime scheduledEnd;
    private LocalDateTime startedAt;
    private LocalDateTime finishedAt;
}
