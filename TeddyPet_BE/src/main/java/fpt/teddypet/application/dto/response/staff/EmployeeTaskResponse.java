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
    /** Để mở trang chi tiết: /admin/booking/detail/{bookingId}/pet/{bookingPetId}/service/{id}. */
    private Long bookingId;
    private Long bookingPetId;
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

    /**
     * {@code true} khi booking đã check-in tại lễ tân — nhân viên mới được phép bắt đầu xử lý dịch vụ này.
     */
    private boolean bookingCheckedIn;

    /**
     * {@code true} khi dịch vụ gắn phòng ({@code service.isRequiredRoom}) — FE chỉ hiển thị "Bắt đầu", không có "Hoàn thành".
     */
    private Boolean serviceRequiresRoom;

    /** FE dùng để bật nút "Hoàn thành" Spa khi đã có đủ 3 nhóm ảnh. */
    private Boolean hasBeforePhotos;
    private Boolean hasDuringPhotos;
    private Boolean hasAfterPhotos;
}
