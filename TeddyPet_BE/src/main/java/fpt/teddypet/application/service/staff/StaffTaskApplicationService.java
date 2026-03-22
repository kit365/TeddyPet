package fpt.teddypet.application.service.staff;

import fpt.teddypet.application.dto.response.staff.EmployeeTaskResponse;
import fpt.teddypet.domain.entity.Booking;
import fpt.teddypet.domain.entity.BookingPetService;
import fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.BookingPetServiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StaffTaskApplicationService {

    private static final ZoneId VIETNAM = ZoneId.of("Asia/Ho_Chi_Minh");

    private final BookingPetServiceRepository bookingPetServiceRepository;

    public List<EmployeeTaskResponse> getTodayTasks(Long staffId) {
        LocalDate today = LocalDate.now(VIETNAM);
        LocalDateTime dayStart = today.atStartOfDay();
        LocalDateTime dayEnd = today.plusDays(1).atStartOfDay();
        List<BookingPetService> services = bookingPetServiceRepository.findTasksForStaffByAssignedShiftsInDay(
                staffId,
                dayStart,
                dayEnd
        );
        return services.stream().map(this::toEmployeeTask).collect(Collectors.toList());
    }

    private EmployeeTaskResponse toEmployeeTask(BookingPetService bps) {
        Booking booking = bps.getBookingPet() != null ? bps.getBookingPet().getBooking() : null;
        String bookingCode = booking != null ? booking.getBookingCode() : null;
        String customerName = booking != null ? booking.getCustomerName() : null;

        boolean isCombo = bps.getServiceCombo() != null;
        fpt.teddypet.domain.entity.Service svc = bps.getService();
        String title = isCombo
                ? bps.getServiceCombo().getComboName()
                : (svc != null ? svc.getServiceName() : "Dịch vụ");

        boolean roomService = !isCombo && svc != null && Boolean.TRUE.equals(svc.getIsRequiredRoom());
        String type = roomService ? "CARE" : "SPA";

        String spaCategory = mapSpaCategory(isCombo, svc);

        String cageLabel = cageLabelFor(bps);
        String petName = bps.getBookingPet() != null ? bps.getBookingPet().getPetName() : "";
        String petSpecies = bps.getBookingPet() != null ? bps.getBookingPet().getPetType() : "";

        int durationMinutes = computeDurationMinutes(bps);
        LocalDateTime bookingTime = bps.getScheduledStartTime() != null
                ? bps.getScheduledStartTime()
                : (bps.getEstimatedCheckInDate() != null ? bps.getEstimatedCheckInDate().atStartOfDay() : null);

        return EmployeeTaskResponse.builder()
                .id(bps.getId())
                .type(type)
                .title(title)
                .description(bps.getStaffNotes() != null ? bps.getStaffNotes() : "Chưa có ghi chú")
                .status(normalizeTaskStatus(bps.getStatus()))
                .createdAt(bps.getCreatedAt())
                .bookingCode(bookingCode)
                .customerName(customerName)
                .cageNumber(cageLabel)
                .petName(petName)
                .petSpecies(petSpecies)
                .notes(bps.getBookingPet() != null ? bps.getBookingPet().getPetConditionNotes() : "")
                .serviceType(roomService ? "ROOM" : spaCategory)
                .bookingTime(bookingTime)
                .durationMinutes(durationMinutes)
                .scheduledStart(bps.getScheduledStartTime())
                .scheduledEnd(bps.getScheduledEndTime())
                .startedAt(bps.getActualStartTime())
                .finishedAt(bps.getActualEndTime())
                .build();
    }

    private static String cageLabelFor(BookingPetService bps) {
        if (bps.getRoomId() != null) {
            return "Phòng #" + bps.getRoomId();
        }
        return "—";
    }

    private static int computeDurationMinutes(BookingPetService bps) {
        if (bps.getScheduledStartTime() != null && bps.getScheduledEndTime() != null) {
            long m = Duration.between(bps.getScheduledStartTime(), bps.getScheduledEndTime()).toMinutes();
            if (m > 0) {
                return (int) Math.min(m, Integer.MAX_VALUE);
            }
        }
        return 60;
    }

    private static String mapSpaCategory(boolean isCombo, fpt.teddypet.domain.entity.Service svc) {
        if (isCombo) {
            return "COMBO";
        }
        if (svc == null || svc.getServiceName() == null) {
            return "SHOWER";
        }
        String n = svc.getServiceName().toLowerCase(Locale.ROOT);
        if (n.contains("cắt") || n.contains("tỉa")) {
            return "HAIRCUT";
        }
        if (n.contains("móng")) {
            return "NAIL";
        }
        return "SHOWER";
    }

    private static String normalizeTaskStatus(String raw) {
        if (raw == null || raw.isBlank()) {
            return "PENDING";
        }
        String u = raw.trim().toUpperCase(Locale.ROOT);
        return switch (u) {
            case "IN_PROGRESS" -> "IN_PROGRESS";
            case "COMPLETED", "DONE", "COMPLETE" -> "COMPLETED";
            case "PENDING" -> "PENDING";
            default -> "PENDING";
        };
    }
}
