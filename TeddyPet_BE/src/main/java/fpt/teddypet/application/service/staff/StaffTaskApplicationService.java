package fpt.teddypet.application.service.staff;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import fpt.teddypet.application.dto.request.staff.StaffTaskServicePhotosRequest;
import fpt.teddypet.application.dto.response.staff.EmployeeTaskResponse;
import fpt.teddypet.application.port.output.staff.StaffProfileRepositoryPort;
import fpt.teddypet.domain.entity.Booking;
import fpt.teddypet.domain.entity.BookingPetService;
import fpt.teddypet.domain.entity.staff.StaffProfile;
import fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.BookingPetServiceRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StaffTaskApplicationService {

    private static final ZoneId VIETNAM = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private final BookingPetServiceRepository bookingPetServiceRepository;
    private final StaffProfileRepositoryPort staffProfileRepositoryPort;

    /**
     * Nhiệm vụ dashboard nhân viên: không chỉ “đúng hôm nay” — lịch xếp ca thường là ngày tới
     * (admin xếp trước). Lấy các dòng đã gán NV có {@code scheduledStartTime} trong khoảng
     * 7 ngày trước → 30 ngày tới (theo giờ VN).
     */
    public List<EmployeeTaskResponse> getTodayTasks(Long staffId) {
        LocalDate today = LocalDate.now(VIETNAM);
        LocalDateTime rangeStart = today.minusDays(7).atStartOfDay();
        LocalDateTime rangeEnd = today.plusDays(30).atStartOfDay();
        List<BookingPetService> services = bookingPetServiceRepository.findTasksForStaffByAssignedShiftsInRange(
                staffId,
                rangeStart,
                rangeEnd
        );
        return services.stream().map(this::toEmployeeTask).collect(Collectors.toList());
    }

    /**
     * Bắt đầu xử lý: gán nhân viên hiện tại vào {@code assignedStaff} (nếu chưa có), set {@code actualStartTime}, trạng thái {@code IN_PROGRESS}.
     */
    @Transactional
    public EmployeeTaskResponse startTask(Long bookingPetServiceId, Long staffId) {
        BookingPetService bps = getBookingPetServiceForTask(bookingPetServiceId);
        requireBookingCheckedIn(bps);
        assertNotCancelledBps(bps);

        boolean assignedChanged = ensureAssignedStaff(bps, staffId);
        String st = normalizeTaskStatus(bps.getStatus());
        if ("COMPLETED".equals(st) || "PET_IN_HOTEL".equals(st)) {
            throw new IllegalArgumentException("Dịch vụ đã hoàn thành, không thể bắt đầu lại.");
        }
        if ("IN_PROGRESS".equals(st) && bps.getActualStartTime() != null) {
            if (assignedChanged) {
                return toEmployeeTask(bookingPetServiceRepository.save(bps));
            }
            return toEmployeeTask(bps);
        }
        if (!"PENDING".equals(st) && !"WAITING_STAFF".equals(st)) {
            throw new IllegalArgumentException("Trạng thái hiện tại không thể bắt đầu xử lý.");
        }

        bps.setActualStartTime(LocalDateTime.now(VIETNAM));
        bps.setStatus("IN_PROGRESS");
        return toEmployeeTask(bookingPetServiceRepository.save(bps));
    }

    /**
     * Hoàn thành dịch vụ không gắn phòng: set {@code actualEndTime} và trạng thái {@code COMPLETED}.
     * Dịch vụ phòng ({@code isRequiredRoom = true}) không dùng API này.
     */
    @Transactional
    public EmployeeTaskResponse completeTask(Long bookingPetServiceId, Long staffId) {
        BookingPetService bps = getBookingPetServiceForTask(bookingPetServiceId);
        boolean roomOnly = isRoomService(bps);
        if (roomOnly) {
            throw new IllegalArgumentException("Dịch vụ phòng không dùng nút hoàn thành tại đây.");
        }
        if (bps.getServiceCombo() == null && bps.getService() == null) {
            throw new IllegalArgumentException("Không xác định được dịch vụ để hoàn thành.");
        }
        requireBookingCheckedIn(bps);
        assertNotCancelledBps(bps);
        assertAssignedStaff(bps, staffId);

        String st = normalizeTaskStatus(bps.getStatus());
        if ("COMPLETED".equals(st)) {
            return toEmployeeTask(bps);
        }
        if ("PET_IN_HOTEL".equals(st)) {
            throw new IllegalArgumentException("Dịch vụ đã ở trạng thái đã đưa thú cưng vào hotel.");
        }
        if (!"IN_PROGRESS".equals(st)) {
            throw new IllegalArgumentException("Trạng thái hiện tại chưa thể hoàn thành dịch vụ.");
        }
        if (!hasAtLeastOnePhoto(bps.getBeforePhotos())
                || !hasAtLeastOnePhoto(bps.getDuringPhotos())
                || !hasAtLeastOnePhoto(bps.getAfterPhotos())) {
            throw new IllegalArgumentException("Vui lòng chụp đủ ảnh trước/trong/sau khi hoàn thành dịch vụ.");
        }

        if (bps.getActualStartTime() == null) {
            bps.setActualStartTime(LocalDateTime.now(VIETNAM));
        }
        bps.setActualEndTime(LocalDateTime.now(VIETNAM));
        bps.setStatus("COMPLETED");
        return toEmployeeTask(bookingPetServiceRepository.save(bps));
    }

    @Transactional
    public EmployeeTaskResponse updateServicePhotos(
            Long bookingPetServiceId,
            Long staffId,
            StaffTaskServicePhotosRequest request
    ) {
        BookingPetService bps = getBookingPetServiceForTask(bookingPetServiceId);
        requireBookingCheckedIn(bps);
        assertNotCancelledBps(bps);
        assertAssignedStaff(bps, staffId);
        if (isRoomService(bps)) {
            throw new IllegalArgumentException("Dịch vụ phòng không dùng luồng upload ảnh trước/trong/sau.");
        }
        String st = normalizeTaskStatus(bps.getStatus());
        if (!"IN_PROGRESS".equals(st)) {
            throw new IllegalArgumentException("Trạng thái hiện tại chưa thể cập nhật ảnh dịch vụ.");
        }

        if (request.beforePhotos() != null) {
            bps.setBeforePhotos(serializePhotoUrls(request.beforePhotos()));
        }
        if (request.duringPhotos() != null) {
            bps.setDuringPhotos(serializePhotoUrls(request.duringPhotos()));
        }
        if (request.afterPhotos() != null) {
            bps.setAfterPhotos(serializePhotoUrls(request.afterPhotos()));
        }
        return toEmployeeTask(bookingPetServiceRepository.save(bps));
    }

    @Transactional
    public EmployeeTaskResponse markPetInHotel(Long bookingPetServiceId, Long staffId) {
        BookingPetService bps = getBookingPetServiceForTask(bookingPetServiceId);
        requireBookingCheckedIn(bps);
        assertNotCancelledBps(bps);
        assertAssignedStaff(bps, staffId);
        if (!isRoomService(bps)) {
            throw new IllegalArgumentException("Nút đã set up xong chỉ áp dụng cho dịch vụ cần phòng.");
        }

        String st = normalizeTaskStatus(bps.getStatus());
        if ("PET_IN_HOTEL".equals(st)) {
            return toEmployeeTask(bps);
        }
        if ("COMPLETED".equals(st)) {
            throw new IllegalArgumentException("Dịch vụ đã hoàn thành, không thể set up lại.");
        }
        if (!"IN_PROGRESS".equals(st) && !"WAITING_STAFF".equals(st) && !"PENDING".equals(st)) {
            throw new IllegalArgumentException("Trạng thái hiện tại không thể chuyển sang đã set up xong.");
        }

        if (bps.getActualStartTime() == null) {
            bps.setActualStartTime(LocalDateTime.now(VIETNAM));
        }
        bps.setStatus("PET_IN_HOTEL");
        return toEmployeeTask(bookingPetServiceRepository.save(bps));
    }

    private static void assertNotCancelledBps(BookingPetService bps) {
        String u = bps.getStatus() != null ? bps.getStatus().trim().toUpperCase(Locale.ROOT) : "";
        if ("CANCELLED".equals(u)) {
            throw new IllegalArgumentException("Dịch vụ đã bị hủy.");
        }
    }

    private BookingPetService getBookingPetServiceForTask(Long bookingPetServiceId) {
        return bookingPetServiceRepository.findByIdWithRelationsForWorkShiftAssign(bookingPetServiceId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy booking_pet_service id=" + bookingPetServiceId));
    }

    private static Booking getBookingOrThrow(BookingPetService bps) {
        Booking booking = bps.getBookingPet() != null ? bps.getBookingPet().getBooking() : null;
        if (booking == null) {
            throw new IllegalArgumentException("Dịch vụ không gắn booking hợp lệ.");
        }
        return booking;
    }

    private static void requireBookingCheckedIn(BookingPetService bps) {
        Booking booking = getBookingOrThrow(bps);
        if (booking.getBookingCheckInDate() == null) {
            throw new IllegalArgumentException("Booking chưa check-in tại lễ tân.");
        }
    }

    private boolean ensureAssignedStaff(BookingPetService bps, Long staffId) {
        StaffProfile staff = staffProfileRepositoryPort.findById(staffId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy hồ sơ nhân viên id=" + staffId));
        boolean alreadyAssigned = bps.getAssignedStaff() != null
                && bps.getAssignedStaff().stream().anyMatch(s -> s.getId().equals(staffId));
        if (!alreadyAssigned) {
            bps.getAssignedStaff().add(staff);
            return true;
        }
        return false;
    }

    private static void assertAssignedStaff(BookingPetService bps, Long staffId) {
        boolean assigned = bps.getAssignedStaff() != null
                && bps.getAssignedStaff().stream().anyMatch(s -> s.getId().equals(staffId));
        if (!assigned) {
            throw new IllegalArgumentException("Bạn không được gán xử lý dịch vụ này.");
        }
    }

    private static boolean isRoomService(BookingPetService bps) {
        boolean isCombo = bps.getServiceCombo() != null;
        fpt.teddypet.domain.entity.Service svc = bps.getService();
        return !isCombo && svc != null && Boolean.TRUE.equals(svc.getIsRequiredRoom());
    }

    private static String serializePhotoUrls(List<String> urls) {
        List<String> sanitized = new ArrayList<>();
        if (urls != null) {
            for (String url : urls) {
                if (url == null) continue;
                String v = url.trim();
                if (!v.isBlank()) sanitized.add(v);
            }
        }
        try {
            return OBJECT_MAPPER.writeValueAsString(sanitized);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Không thể lưu ảnh dịch vụ.", e);
        }
    }

    private static boolean hasAtLeastOnePhoto(String raw) {
        if (raw == null || raw.isBlank()) return false;
        String s = raw.trim();
        if (!s.startsWith("[")) {
            return !s.isBlank();
        }
        try {
            List<String> list = OBJECT_MAPPER.readValue(s, new TypeReference<>() {});
            if (list == null || list.isEmpty()) return false;
            for (String it : list) {
                if (it != null && !it.trim().isBlank()) return true;
            }
            return false;
        } catch (JsonProcessingException e) {
            return false;
        }
    }

    private EmployeeTaskResponse toEmployeeTask(BookingPetService bps) {
        Booking booking = bps.getBookingPet() != null ? bps.getBookingPet().getBooking() : null;
        String bookingCode = booking != null ? booking.getBookingCode() : null;
        Long bookingId = booking != null ? booking.getId() : null;
        Long bookingPetId = bps.getBookingPet() != null ? bps.getBookingPet().getId() : null;
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

        boolean bookingCheckedIn = booking != null && booking.getBookingCheckInDate() != null;

        return EmployeeTaskResponse.builder()
                .id(bps.getId())
                .type(type)
                .title(title)
                .description(bps.getStaffNotes() != null ? bps.getStaffNotes() : "Chưa có ghi chú")
                .status(normalizeTaskStatus(bps.getStatus()))
                .createdAt(bps.getCreatedAt())
                .bookingCode(bookingCode)
                .bookingId(bookingId)
                .bookingPetId(bookingPetId)
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
                .bookingCheckedIn(bookingCheckedIn)
                .serviceRequiresRoom(roomService)
                .hasBeforePhotos(hasAtLeastOnePhoto(bps.getBeforePhotos()))
                .hasDuringPhotos(hasAtLeastOnePhoto(bps.getDuringPhotos()))
                .hasAfterPhotos(hasAtLeastOnePhoto(bps.getAfterPhotos()))
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
            case "WAITING_STAFF" -> "WAITING_STAFF";
            case "PET_IN_HOTEL" -> "PET_IN_HOTEL";
            default -> u;
        };
    }
}
