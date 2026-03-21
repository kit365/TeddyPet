package fpt.teddypet.application.service.staff;

import fpt.teddypet.application.dto.response.staff.EmployeeTaskResponse;
import fpt.teddypet.domain.entity.BookingPetService;
import fpt.teddypet.domain.enums.staff.RegistrationStatus;
import fpt.teddypet.domain.enums.staff.ShiftStatus;
import fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.BookingPetServiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StaffTaskApplicationService {

    private final BookingPetServiceRepository bookingPetServiceRepository;

    public List<EmployeeTaskResponse> getTodayTasks(Long staffId) {
        LocalDate today = LocalDate.now();
        LocalDate weekStartDate = today.with(java.time.DayOfWeek.MONDAY);
        LocalDate weekEndDateExclusive = weekStartDate.plusDays(7);
        LocalDateTime dayStart = weekStartDate.atStartOfDay();
        LocalDateTime dayEnd = weekEndDateExclusive.atStartOfDay();
        List<BookingPetService> services = bookingPetServiceRepository.findTasksForStaffByAssignedShiftsInDay(
                staffId,
                dayStart,
                dayEnd,
                RegistrationStatus.APPROVED,
                ShiftStatus.ASSIGNED
        );

        return services.stream().map(bps -> {
            String type = "CARE";
            String title = "";
            String serviceType = "SINGLE";
            
            if (bps.getServiceCombo() != null) {
                title = bps.getServiceCombo().getComboName();
                serviceType = "COMBO";
                type = "SPA"; // Mặc định combo là spa
            } else if (bps.getService() != null) {
                title = bps.getService().getServiceName();
                type = "SPA"; // Mặc định tất cả service là SPA, frontend có logic phân loại role
            }

            String petName = bps.getBookingPet() != null ? bps.getBookingPet().getPetName() : "";
            String petSpecies = bps.getBookingPet() != null ? bps.getBookingPet().getPetType() : "";

            return EmployeeTaskResponse.builder()
                .id(bps.getId())
                .type(type)
                .title(title)
                .description(bps.getStaffNotes() != null ? bps.getStaffNotes() : "Chưa có ghi chú")
                .status(bps.getStatus() != null ? bps.getStatus() : "PENDING")
                .createdAt(bps.getCreatedAt())
                .cageNumber(bps.getRoomId() != null ? "Room " + bps.getRoomId() : "N/A")
                .petName(petName)
                .petSpecies(petSpecies)
                .notes(bps.getBookingPet() != null ? bps.getBookingPet().getPetConditionNotes() : "")
                .serviceType(serviceType)
                .bookingTime(bps.getEstimatedCheckInDate() != null ? bps.getEstimatedCheckInDate().atStartOfDay() : null)
                .durationMinutes(60) // Logic cứng 60p, sau update theo field duration
                .scheduledStart(bps.getScheduledStartTime())
                .scheduledEnd(bps.getScheduledEndTime())
                .startedAt(bps.getActualStartTime())
                .finishedAt(bps.getActualEndTime())
                .build();
        }).collect(Collectors.toList());
    }
}
