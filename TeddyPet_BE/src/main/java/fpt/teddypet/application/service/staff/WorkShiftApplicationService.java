package fpt.teddypet.application.service.staff;

import fpt.teddypet.application.dto.request.staff.OpenShiftRequest;
import fpt.teddypet.application.dto.request.staff.ShiftRoleConfigItemRequest;
import fpt.teddypet.application.dto.response.staff.AvailableShiftForStaffResponse;
import fpt.teddypet.application.dto.response.staff.RoleSlotInfoResponse;
import fpt.teddypet.application.dto.response.staff.ShiftRoleConfigResponse;
import fpt.teddypet.application.dto.response.staff.WorkShiftAssignOptionsResponse;
import fpt.teddypet.application.dto.response.staff.WorkShiftBookingPetServiceItemResponse;
import fpt.teddypet.application.dto.response.staff.WorkShiftBookingPetServicePoolResponse;
import fpt.teddypet.application.dto.response.staff.WorkShiftAssignedBookingPetServiceResponse;
import fpt.teddypet.application.dto.response.staff.WorkShiftCoverageDayResponse;
import fpt.teddypet.application.dto.response.staff.WorkShiftRegistrationResponse;
import fpt.teddypet.application.dto.response.staff.WorkShiftResponse;
import fpt.teddypet.application.port.input.staff.WorkShiftService;
import fpt.teddypet.application.port.output.staff.ShiftRoleConfigRepositoryPort;
import fpt.teddypet.application.port.output.staff.StaffFixedScheduleRepositoryPort;
import fpt.teddypet.application.port.output.staff.StaffPositionRepositoryPort;
import fpt.teddypet.application.port.output.staff.StaffProfileRepositoryPort;
import fpt.teddypet.application.port.output.staff.WorkShiftRegistrationRepositoryPort;
import fpt.teddypet.application.port.output.staff.WorkShiftRepositoryPort;
import fpt.teddypet.domain.entity.staff.ShiftRoleConfig;
import fpt.teddypet.domain.entity.Booking;
import fpt.teddypet.domain.entity.BookingPetService;
import fpt.teddypet.domain.entity.staff.StaffFixedSchedule;
import fpt.teddypet.domain.entity.staff.StaffProfile;
import fpt.teddypet.domain.entity.staff.StaffPosition;
import fpt.teddypet.domain.entity.staff.WorkShift;
import fpt.teddypet.domain.entity.staff.WorkShiftRegistration;
import fpt.teddypet.domain.enums.bookings.BookingTypeEnum;
import fpt.teddypet.domain.enums.staff.EmploymentTypeEnum;
import fpt.teddypet.domain.enums.staff.RegistrationStatus;
import fpt.teddypet.domain.enums.staff.ShiftStatus;
import fpt.teddypet.domain.exception.AlreadyRegisteredException;
import fpt.teddypet.domain.exception.FullTimeCannotRegisterException;
import fpt.teddypet.domain.exception.ShiftRoleQuotaExceededException;
import fpt.teddypet.domain.exception.ShiftRoleSlotsFullException;
import fpt.teddypet.domain.exception.InvalidShiftStatusException;
import fpt.teddypet.domain.exception.ShiftMustBeNextWeekException;
import fpt.teddypet.domain.exception.ShiftNotFoundException;
import fpt.teddypet.domain.exception.ShiftOverlapException;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.BookingPetServiceRepository;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WorkShiftApplicationService implements WorkShiftService {

    private final WorkShiftRepositoryPort workShiftRepositoryPort;
    private final WorkShiftRegistrationRepositoryPort registrationRepositoryPort;
    private final ShiftRoleConfigRepositoryPort shiftRoleConfigRepositoryPort;
    private final StaffFixedScheduleRepositoryPort staffFixedScheduleRepositoryPort;
    private final StaffPositionRepositoryPort staffPositionRepositoryPort;
    private final StaffProfileRepositoryPort staffProfileRepositoryPort;
    private final BookingPetServiceRepository bookingPetServiceRepository;
    private final WorkShiftBookingAssignmentHelper workShiftBookingAssignmentHelper;

    private static final ZoneId VIETNAM = ZoneId.of("Asia/Ho_Chi_Minh");

    /**
     * Template định mức cơ bản cho một ca theo 3 nhóm vai trò:
     * - NV_BH: Nhân viên Bán hàng & Thu ngân
     * - NV_SP: Chuyên viên Spa Thú cưng (Groomer)
     * - NV_CS: Nhân viên Chăm sóc Thú cưng
     */
    private static final class BaseQuotaTemplate {
        private final int nvBh;
        private final int nvSp;
        private final int nvCs;

        private BaseQuotaTemplate(int nvBh, int nvSp, int nvCs) {
            this.nvBh = nvBh;
            this.nvSp = nvSp;
            this.nvCs = nvCs;
        }

        public int getNvBh() {
            return nvBh;
        }

        public int getNvSp() {
            return nvSp;
        }

        public int getNvCs() {
            return nvCs;
        }
    }

    /** Tuần tiếp theo: từ Thứ 2 00:00 đến Chủ nhật 23:59:59 */
    private static LocalDateTime[] getNextWeekRange() {
        LocalDate today = LocalDate.now();
        DayOfWeek dow = today.getDayOfWeek();
        int daysUntilNextMonday = dow == DayOfWeek.SUNDAY ? 1 : (dow == DayOfWeek.MONDAY ? 7 : 8 - dow.getValue());
        LocalDate nextMonday = today.plusDays(daysUntilNextMonday);
        LocalDate nextSunday = nextMonday.plusDays(6);
        LocalDateTime start = nextMonday.atStartOfDay();
        LocalDateTime end = nextSunday.atTime(23, 59, 59);
        return new LocalDateTime[]{start, end};
    }

    /**
     * Lấy định mức cơ bản cho ca dựa trên thứ trong tuần và buổi (sáng/chiều).
     * Quy tắc:
     * - T2–T5 (Sáng & Chiều) + T6 (Sáng)  → { NV_BH: 1, NV_SP: 1, NV_CS: 1 }
     * - T6 (Chiều)                         → { NV_BH: 1, NV_SP: 1, NV_CS: 2 }
     * - T7, CN (Sáng)                      → { NV_BH: 1, NV_SP: 2, NV_CS: 1 }
     * - T7, CN (Chiều)                     → { NV_BH: 1, NV_SP: 2, NV_CS: 2 }
     */
    private static BaseQuotaTemplate getShiftQuota(LocalDateTime startTime) {
        int dayOfWeek = startTime.getDayOfWeek().getValue(); // 1 = Thứ 2, ..., 7 = Chủ nhật
        boolean isAfternoon = startTime.getHour() >= 12;     // 0–11 = sáng, 12h+ = chiều

        boolean isMonToThu = dayOfWeek >= 1 && dayOfWeek <= 4;     // T2–T5
        boolean isFriday = dayOfWeek == 5;                          // T6
        boolean isWeekend = dayOfWeek == 6 || dayOfWeek == 7;       // T7, CN

        if (isMonToThu || (isFriday && !isAfternoon)) {
            // T2–T5 (sáng & chiều) + T6 (sáng)
            return new BaseQuotaTemplate(1, 1, 1);
        }

        if (isFriday && isAfternoon) {
            // T6 (chiều)
            return new BaseQuotaTemplate(1, 1, 2);
        }

        if (isWeekend && !isAfternoon) {
            // T7, CN (sáng)
            return new BaseQuotaTemplate(1, 2, 1);
        }

        // T7, CN (chiều)
        return new BaseQuotaTemplate(1, 2, 2);
    }

    @Override
    @Transactional
    public WorkShiftResponse createOpenShift(OpenShiftRequest request) {
        LocalDateTime[] nextWeek = getNextWeekRange();
        LocalDateTime weekStart = nextWeek[0];
        LocalDateTime weekEnd = nextWeek[1];
        if (request.startTime().isBefore(weekStart) || request.startTime().isAfter(weekEnd)) {
            throw new ShiftMustBeNextWeekException("Chỉ được tạo ca trống cho tuần tiếp theo. Giờ bắt đầu phải trong khoảng " + weekStart + " đến " + weekEnd);
        }
        if (request.endTime().isBefore(weekStart) || request.endTime().isAfter(weekEnd)) {
            throw new ShiftMustBeNextWeekException("Chỉ được tạo ca trống cho tuần tiếp theo. Giờ kết thúc phải trong khoảng " + weekStart + " đến " + weekEnd);
        }
        if (!request.endTime().isAfter(request.startTime())) {
            throw new IllegalArgumentException("Giờ kết thúc phải sau giờ bắt đầu");
        }
        if (!workShiftRepositoryPort.findOverlapping(request.startTime(), request.endTime(), null).isEmpty()) {
            throw new ShiftOverlapException("Ca làm trùng với ca đã có. Vui lòng chọn giờ khác.");
        }
        WorkShift shift = WorkShift.builder()
                .startTime(request.startTime())
                .endTime(request.endTime())
                .status(ShiftStatus.OPEN)
                .staff(null)
                .build();
        WorkShift saved = workShiftRepositoryPort.save(shift);
        createDefaultRoleConfigsForShift(saved);
        autoFillFullTime(saved);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public List<WorkShiftResponse> createOpenShiftsBatch(List<OpenShiftRequest> requests) {
        LocalDateTime[] nextWeek = getNextWeekRange();
        LocalDateTime weekStart = nextWeek[0];
        LocalDateTime weekEnd = nextWeek[1];
        for (OpenShiftRequest req : requests) {
            if (req.startTime().isBefore(weekStart) || req.startTime().isAfter(weekEnd)) {
                throw new ShiftMustBeNextWeekException("Chỉ được tạo ca trống cho tuần tiếp theo. Giờ bắt đầu phải trong khoảng " + weekStart + " đến " + weekEnd);
            }
            if (req.endTime().isBefore(weekStart) || req.endTime().isAfter(weekEnd)) {
                throw new ShiftMustBeNextWeekException("Chỉ được tạo ca trống cho tuần tiếp theo. Giờ kết thúc phải trong khoảng " + weekStart + " đến " + weekEnd);
            }
            if (!req.endTime().isAfter(req.startTime())) {
                throw new IllegalArgumentException("Giờ kết thúc phải sau giờ bắt đầu");
            }
        }
        // Trong batch không cho phép hai ca trùng giờ
        for (int i = 0; i < requests.size(); i++) {
            for (int j = i + 1; j < requests.size(); j++) {
                OpenShiftRequest a = requests.get(i);
                OpenShiftRequest b = requests.get(j);
                if (a.startTime().isBefore(b.endTime()) && b.startTime().isBefore(a.endTime())) {
                    throw new ShiftOverlapException("Trong danh sách có ca trùng giờ. Vui lòng kiểm tra lại.");
                }
            }
        }
        // Chỉ tạo những ca chưa có (bỏ qua ca trùng với DB)
        List<WorkShiftResponse> created = new java.util.ArrayList<>();
        for (OpenShiftRequest req : requests) {
            if (!workShiftRepositoryPort.findOverlapping(req.startTime(), req.endTime(), null).isEmpty()) {
                continue; // đã có ca trùng → bỏ qua
            }
            WorkShift shift = WorkShift.builder()
                    .startTime(req.startTime())
                    .endTime(req.endTime())
                    .status(ShiftStatus.OPEN)
                    .staff(null)
                    .build();
            WorkShift saved = workShiftRepositoryPort.save(shift);
            createDefaultRoleConfigsForShift(saved);
            autoFillFullTime(saved);
            created.add(toResponse(saved));
        }
        return created;
    }

    @Override
    @Transactional
    public WorkShiftResponse updateOpenShift(Long shiftId, OpenShiftRequest request) {
        WorkShift shift = getShiftOrThrow(shiftId);
        if (shift.getStatus() != ShiftStatus.OPEN) {
            throw new InvalidShiftStatusException(shiftId, shift.getStatus(), "chỉnh sửa ca trống");
        }
        LocalDateTime[] nextWeek = getNextWeekRange();
        LocalDateTime weekStart = nextWeek[0];
        LocalDateTime weekEnd = nextWeek[1];
        if (request.startTime().isBefore(weekStart) || request.startTime().isAfter(weekEnd)) {
            throw new ShiftMustBeNextWeekException("Giờ bắt đầu phải trong tuần tiếp theo: " + weekStart + " đến " + weekEnd);
        }
        if (request.endTime().isBefore(weekStart) || request.endTime().isAfter(weekEnd)) {
            throw new ShiftMustBeNextWeekException("Giờ kết thúc phải trong tuần tiếp theo: " + weekStart + " đến " + weekEnd);
        }
        if (!request.endTime().isAfter(request.startTime())) {
            throw new IllegalArgumentException("Giờ kết thúc phải sau giờ bắt đầu");
        }
        if (!workShiftRepositoryPort.findOverlapping(request.startTime(), request.endTime(), shiftId).isEmpty()) {
            throw new ShiftOverlapException("Ca làm trùng với ca đã có. Vui lòng chọn giờ khác.");
        }
        shift.setStartTime(request.startTime());
        shift.setEndTime(request.endTime());
        WorkShift saved = workShiftRepositoryPort.save(shift);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public void cancelOpenShift(Long shiftId) {
        WorkShift shift = getShiftOrThrow(shiftId);
        if (shift.getStatus() != ShiftStatus.OPEN) {
            throw new InvalidShiftStatusException(shiftId, shift.getStatus(), "hủy ca trống (chỉ hủy được ca đang trống)");
        }
        shift.setStatus(ShiftStatus.CANCELLED);
        shift.setActive(false);
        shift.setDeleted(true);
        workShiftRepositoryPort.save(shift);
    }

    @Override
    @Transactional
    public void deleteAllWorkShifts() {
        // Chỉ xóa ca của tuần TIẾP THEO (không xóa tuần hiện tại hoặc tuần đã qua)
        LocalDateTime[] nextWeek = getNextWeekRange();
        LocalDateTime weekStart = nextWeek[0];
        LocalDateTime weekEnd = nextWeek[1];

        List<WorkShift> shifts = workShiftRepositoryPort.findByStartTimeBetween(weekStart, weekEnd);

        for (WorkShift shift : shifts) {
            Long shiftId = shift.getId();

            // Đánh dấu soft-delete cho định mức vai trò
            List<ShiftRoleConfig> configs = shiftRoleConfigRepositoryPort.findByWorkShiftId(shiftId);
            for (ShiftRoleConfig config : configs) {
                config.setActive(false);
                config.setDeleted(true);
                shiftRoleConfigRepositoryPort.save(config);
            }

            // Đánh dấu soft-delete cho các đăng ký ca
            List<WorkShiftRegistration> regs = registrationRepositoryPort.findByWorkShiftIdOrderByRegisteredAtAsc(shiftId);
            for (WorkShiftRegistration reg : regs) {
                reg.setActive(false);
                reg.setDeleted(true);
                registrationRepositoryPort.save(reg);
            }

            // Đánh dấu soft-delete cho ca làm
            shift.setStatus(ShiftStatus.CANCELLED);
            shift.setActive(false);
            shift.setDeleted(true);
            workShiftRepositoryPort.save(shift);
        }
    }

    @Override
    public List<WorkShiftResponse> getShiftsForAdminByDateRange(Instant from, Instant to) {
        if (from == null || to == null) {
            return List.of();
        }
        LocalDateTime fromLdt = LocalDateTime.ofInstant(from, VIETNAM);
        LocalDateTime toLdt = LocalDateTime.ofInstant(to, VIETNAM);
        List<WorkShift> shifts = workShiftRepositoryPort.findByStartTimeBetween(fromLdt, toLdt);
        return shifts.stream().map(this::toResponse).toList();
    }

    @Override
    public List<WorkShiftResponse> getAvailableShifts(LocalDateTime from, LocalDateTime to) {
        List<WorkShift> shifts;
        if (from != null && to != null) {
            shifts = workShiftRepositoryPort.findByStatusAndStartTimeBetween(ShiftStatus.OPEN, from, to);
        } else {
            shifts = workShiftRepositoryPort.findByStatus(ShiftStatus.OPEN);
        }
        return shifts.stream().map(this::toResponse).toList();
    }

    @Override
    public List<AvailableShiftForStaffResponse> getAvailableShiftsForStaff(LocalDateTime from, LocalDateTime to) {
        List<WorkShift> shifts;
        if (from != null && to != null) {
            shifts = workShiftRepositoryPort.findByStatusAndStartTimeBetween(ShiftStatus.OPEN, from, to);
        } else {
            shifts = workShiftRepositoryPort.findByStatus(ShiftStatus.OPEN);
        }
        return shifts.stream().map(this::toAvailableShiftForStaff).toList();
    }

    private AvailableShiftForStaffResponse toAvailableShiftForStaff(WorkShift shift) {
        List<ShiftRoleConfig> configs = shiftRoleConfigRepositoryPort.findByWorkShiftId(shift.getId());
        List<RoleSlotInfoResponse> roleSlots = configs.stream()
                .map(c -> {
                    long approved = registrationRepositoryPort.countApprovedByWorkShiftIdAndPositionId(shift.getId(), c.getPosition().getId());
                    // Slot còn trống = chỉ tính người sẽ đi làm (APPROVED, PENDING, PENDING_LEAVE chưa duyệt nghỉ). Đã duyệt nghỉ thì nhả slot cho part-time.
                    long participating = registrationRepositoryPort.countParticipatingByWorkShiftIdAndPositionId(shift.getId(), c.getPosition().getId());
                    int available = Math.max(0, c.getMaxSlots() - (int) participating);
                    return new RoleSlotInfoResponse(
                            c.getPosition().getId(),
                            c.getPosition().getName(),
                            c.getMaxSlots(),
                            approved,
                            available
                    );
                })
                .toList();
        return new AvailableShiftForStaffResponse(
                shift.getId(),
                shift.getStartTime(),
                shift.getEndTime(),
                shift.getStatus(),
                roleSlots
        );
    }

    @Override
    @Transactional
    public WorkShiftRegistrationResponse registerForShift(Long shiftId, Long staffId, Long requestedPositionId) {
        WorkShift shift = getShiftOrThrow(shiftId);
        if (shift.getStatus() != ShiftStatus.OPEN) {
            throw new InvalidShiftStatusException(shiftId, shift.getStatus(), "đăng ký ca");
        }
        if (registrationRepositoryPort.hasActiveRegistrationForShift(shiftId, staffId)) {
            throw new AlreadyRegisteredException(shiftId, staffId);
        }

        StaffProfile staff = staffProfileRepositoryPort.findById(staffId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy nhân viên với id: " + staffId));

        if (staff.getEmploymentType() == EmploymentTypeEnum.FULL_TIME) {
            throw new FullTimeCannotRegisterException();
        }

        // Chọn vai trò đăng ký: null = chức vụ chính; hoặc chức vụ phụ nếu staff có cấu hình
        StaffPosition position = resolveRegistrationPosition(staff, requestedPositionId);

        Long positionId = position != null ? position.getId() : null;
        int maxSlots = 1;
        String roleName = position != null ? position.getName() : "Không xác định";
        if (positionId != null) {
            maxSlots = shiftRoleConfigRepositoryPort.findByWorkShiftIdAndPositionId(shiftId, positionId)
                    .map(ShiftRoleConfig::getMaxSlots)
                    .orElse(1);
            long occupyingCount = registrationRepositoryPort.countParticipatingByWorkShiftIdAndPositionId(shiftId, positionId);
            if (occupyingCount >= maxSlots) {
                throw new ShiftRoleQuotaExceededException(shiftId, roleName, maxSlots);
            }
        } else {
            long occupyingCount = registrationRepositoryPort.countParticipatingByWorkShiftIdAndRoleNull(shiftId);
            if (occupyingCount >= 1) {
                throw new ShiftRoleQuotaExceededException(shiftId, roleName, 1);
            }
        }

        WorkShiftRegistration registration = WorkShiftRegistration.builder()
                .workShift(shift)
                .staff(staff)
                .roleAtRegistration(position)
                .workType(staff.getEmploymentType())
                .status(RegistrationStatus.PENDING)
                .registeredAt(LocalDateTime.now())
                .build();
        WorkShiftRegistration saved = registrationRepositoryPort.save(registration);
        return toRegistrationResponse(saved);
    }

    /** Xác định vai trò đăng ký: null = chính; nếu requestedPositionId trùng chính hoặc chức vụ phụ thì dùng. */
    private StaffPosition resolveRegistrationPosition(StaffProfile staff, Long requestedPositionId) {
        if (requestedPositionId == null) {
            return staff.getPosition();
        }
        StaffPosition main = staff.getPosition();
        if (main != null && main.getId().equals(requestedPositionId)) {
            return main;
        }
        StaffPosition secondary = staff.getSecondaryPosition();
        if (secondary != null && secondary.getId().equals(requestedPositionId)) {
            return secondary;
        }
        throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.BAD_REQUEST,
                "Bạn chỉ có thể đăng ký theo chức vụ chính hoặc chức vụ phụ của mình.");
    }

    @Override
    public List<WorkShiftRegistrationResponse> getMyRegistrations(Long staffId, LocalDateTime from, LocalDateTime to) {
        List<WorkShiftRegistration> list = registrationRepositoryPort.findByStaffIdAndStatusIn(
                staffId, List.of(RegistrationStatus.PENDING, RegistrationStatus.PENDING_LEAVE, RegistrationStatus.ON_LEAVE));
        return list.stream()
                .filter(reg -> {
                    if (from == null && to == null) return true;
                    LocalDateTime start = reg.getWorkShift().getStartTime();
                    if (from != null && start.isBefore(from)) return false;
                    if (to != null && start.isAfter(to)) return false;
                    return true;
                })
                .map(this::toRegistrationResponse)
                .toList();
    }

    @Override
    public List<WorkShiftRegistrationResponse> getRegistrationsForShift(Long shiftId) {
        WorkShift shift = getShiftOrThrow(shiftId);
        List<WorkShiftRegistration> list = new ArrayList<>(
                registrationRepositoryPort.findByWorkShiftIdOrderByRegisteredAtAsc(shift.getId()));
        list.sort(Comparator
                .comparing(WorkShiftRegistration::getWorkType, (a, b) -> {
                    if (a == EmploymentTypeEnum.FULL_TIME && b != EmploymentTypeEnum.FULL_TIME) return -1;
                    if (a != EmploymentTypeEnum.FULL_TIME && b == EmploymentTypeEnum.FULL_TIME) return 1;
                    return 0;
                })
                .thenComparing(WorkShiftRegistration::getRegisteredAt));
        return list.stream().map(this::toRegistrationResponse).toList();
    }

    @Override
    @Transactional
    public WorkShiftResponse approveRegistration(Long shiftId, Long registrationId) {
        WorkShift shift = getShiftOrThrow(shiftId);
        if (shift.getStatus() != ShiftStatus.OPEN) {
            throw new InvalidShiftStatusException(shiftId, shift.getStatus(), "duyệt đăng ký");
        }

        WorkShiftRegistration approvedReg = registrationRepositoryPort
                .findByIdAndWorkShiftId(registrationId, shiftId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Không tìm thấy đăng ký id " + registrationId + " cho ca " + shiftId));

        StaffPosition role = approvedReg.getRoleAtRegistration();
        Long positionId = role != null ? role.getId() : null;
        int maxSlots = 1;
        String roleName = role != null ? role.getName() : "Không xác định";
        if (positionId != null) {
            maxSlots = shiftRoleConfigRepositoryPort.findByWorkShiftIdAndPositionId(shiftId, positionId)
                    .map(ShiftRoleConfig::getMaxSlots)
                    .orElse(1);
            // Đếm người đang giữ slot nhưng loại trừ chính đăng ký đang duyệt (PENDING→APPROVED không thêm người).
            long occupyingCount = registrationRepositoryPort.countParticipatingByWorkShiftIdAndPositionIdExcludingRegistrationId(shiftId, positionId, registrationId);
            if (occupyingCount >= maxSlots) {
                throw new ShiftRoleSlotsFullException(shiftId, roleName, maxSlots);
            }
        } else {
            long occupyingCount = registrationRepositoryPort.countParticipatingByWorkShiftIdAndRoleNullExcludingRegistrationId(shiftId, registrationId);
            if (occupyingCount >= 1) {
                throw new ShiftRoleSlotsFullException(shiftId, roleName, 1);
            }
        }

        approvedReg.setStatus(RegistrationStatus.APPROVED);
        registrationRepositoryPort.save(approvedReg);
        return toResponseFromRegistration(approvedReg);
    }

    @Override
    @Transactional
    public WorkShiftRegistrationResponse setRegistrationOnLeave(Long shiftId, Long registrationId) {
        getShiftOrThrow(shiftId);
        WorkShiftRegistration reg = registrationRepositoryPort.findByIdAndWorkShiftId(registrationId, shiftId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Không tìm thấy đăng ký id " + registrationId + " cho ca " + shiftId));
        if (reg.getStatus() != RegistrationStatus.PENDING_LEAVE) {
            throw new IllegalStateException("Chỉ khi nhân viên ở trạng thái Đã xin nghỉ (chờ duyệt) mới có nút Duyệt xin nghỉ.");
        }
        reg.setLeaveDecision("APPROVED_LEAVE");
        registrationRepositoryPort.save(reg);
        return toRegistrationResponse(reg);
    }

    @Override
    @Transactional
    public WorkShiftRegistrationResponse rejectLeaveRequest(Long shiftId, Long registrationId) {
        getShiftOrThrow(shiftId);
        WorkShiftRegistration reg = registrationRepositoryPort.findByIdAndWorkShiftId(registrationId, shiftId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Không tìm thấy đăng ký id " + registrationId + " cho ca " + shiftId));
        if (reg.getStatus() != RegistrationStatus.PENDING_LEAVE) {
            throw new IllegalStateException("Chỉ khi nhân viên ở trạng thái Đã xin nghỉ (chờ duyệt) mới có nút Từ chối nghỉ.");
        }
        reg.setLeaveDecision("REJECTED_LEAVE");
        registrationRepositoryPort.save(reg);
        return toRegistrationResponse(reg);
    }

    @Override
    @Transactional
    public WorkShiftRegistrationResponse requestLeave(Long shiftId, Long staffId, String reason) {
        WorkShift shift = getShiftOrThrow(shiftId);
        if (shift.getStatus() != ShiftStatus.OPEN) {
            throw new InvalidShiftStatusException(shiftId, shift.getStatus(), "xin nghỉ (ca đã khóa)");
        }
        WorkShiftRegistration reg = registrationRepositoryPort.findByWorkShiftIdAndStaffId(shiftId, staffId)
                .orElseThrow(() -> new EntityNotFoundException("Bạn chưa được gán ca này. Không thể xin nghỉ."));
        if (reg.getStatus() != RegistrationStatus.APPROVED) {
            throw new IllegalStateException("Chỉ có thể xin nghỉ khi ca đang ở trạng thái Đã duyệt.");
        }
        if (reg.getWorkType() != EmploymentTypeEnum.FULL_TIME) {
            throw new IllegalStateException("Chỉ nhân viên toàn thời gian mới dùng Xin nghỉ. Part-time vui lòng liên hệ admin để hủy đăng ký.");
        }
        reg.setStatus(RegistrationStatus.PENDING_LEAVE);
        reg.setLeaveReason(reason);
        registrationRepositoryPort.save(reg);
        return toRegistrationResponse(reg);
    }

    @Override
    @Transactional
    public void cancelMyRegistration(Long shiftId, Long staffId) {
        WorkShift shift = getShiftOrThrow(shiftId);
        if (shift.getStatus() != ShiftStatus.OPEN) {
            throw new InvalidShiftStatusException(shiftId, shift.getStatus(), "hủy đăng ký (ca đã khóa)");
        }
        WorkShiftRegistration reg = registrationRepositoryPort.findByWorkShiftIdAndStaffId(shiftId, staffId)
                .orElseThrow(() -> new EntityNotFoundException("Bạn chưa đăng ký ca này."));
        if (reg.getWorkType() != EmploymentTypeEnum.PART_TIME) {
            throw new IllegalStateException("Chỉ Part-time mới có thể tự hủy đăng ký. Full-time dùng Xin nghỉ.");
        }
        if (reg.getStatus() != RegistrationStatus.PENDING) {
            throw new IllegalStateException("Chỉ có thể hủy khi đăng ký đang ở trạng thái Chờ duyệt.");
        }
        registrationRepositoryPort.deleteById(reg.getId());
    }

    @Override
    @Transactional
    public WorkShiftRegistrationResponse undoLeave(Long shiftId, Long staffId) {
        WorkShift shift = getShiftOrThrow(shiftId);
        if (shift.getStatus() != ShiftStatus.OPEN) {
            throw new InvalidShiftStatusException(shiftId, shift.getStatus(), "hoàn tác xin nghỉ (ca đã khóa)");
        }
        WorkShiftRegistration reg = registrationRepositoryPort.findByWorkShiftIdAndStaffId(shiftId, staffId)
                .orElseThrow(() -> new EntityNotFoundException("Bạn chưa được gán ca này."));
        if (reg.getWorkType() != EmploymentTypeEnum.FULL_TIME) {
            throw new IllegalStateException("Chỉ nhân viên toàn thời gian mới dùng Hoàn tác xin nghỉ.");
        }
        if (reg.getStatus() != RegistrationStatus.ON_LEAVE && reg.getStatus() != RegistrationStatus.PENDING_LEAVE) {
            throw new IllegalStateException("Chỉ có thể hoàn tác khi bạn đã xin nghỉ (chờ duyệt hoặc đã duyệt).");
        }

        // Capacity Check: Ensure revoking leave doesn't exceed quota
        StaffPosition position = reg.getRoleAtRegistration();
        if (position != null) {
            int maxSlots = shiftRoleConfigRepositoryPort.findByWorkShiftIdAndPositionId(shiftId, position.getId())
                    .map(ShiftRoleConfig::getMaxSlots)
                    .orElse(1);
            long occupyingCount = registrationRepositoryPort.countParticipatingByWorkShiftIdAndPositionIdExcludingRegistrationId(shiftId, position.getId(), reg.getId());
            if (occupyingCount >= maxSlots) {
                throw new IllegalStateException("Không thể thu hồi đơn xin nghỉ vì ca làm việc này đã có nhân viên khác được xếp thay thế.");
            }
        }
        reg.setStatus(RegistrationStatus.APPROVED);
        reg.setLeaveDecision(null);
        reg.setLeaveReason(null);
        registrationRepositoryPort.save(reg);
        return toRegistrationResponse(reg);
    }

    @Override
    public WorkShiftResponse getById(Long shiftId) {
        WorkShift shift = getShiftOrThrow(shiftId);
        return toResponse(shift);
    }

    @Override
    public List<WorkShiftResponse> getByStaffAndDateRange(Long staffId, LocalDateTime from, LocalDateTime to) {
        if (from == null) {
            from = LocalDateTime.now().minusMonths(1);
        }
        if (to == null) {
            to = LocalDateTime.now().plusMonths(1);
        }
        return registrationRepositoryPort.findByStaffIdAndStatusInAndShiftStartTimeBetween(
                        staffId,
                        List.of(RegistrationStatus.APPROVED, RegistrationStatus.PENDING_LEAVE, RegistrationStatus.ON_LEAVE),
                        from,
                        to)
                .stream()
                .map(this::toResponseFromRegistration)
                .toList();
    }

    @Override
    public List<ShiftRoleConfigResponse> getRoleConfigsForShift(Long shiftId) {
        getShiftOrThrow(shiftId);
        return shiftRoleConfigRepositoryPort.findByWorkShiftId(shiftId).stream()
                .map(c -> new ShiftRoleConfigResponse(
                        c.getPosition().getId(),
                        c.getPosition().getName(),
                        c.getMaxSlots()))
                .toList();
    }

    @Override
    @Transactional
    public List<ShiftRoleConfigResponse> setRoleConfigsForShift(Long shiftId, List<ShiftRoleConfigItemRequest> configs) {
        WorkShift shift = getShiftOrThrow(shiftId);
        if (shift.getStatus() != ShiftStatus.OPEN) {
            throw new InvalidShiftStatusException(shiftId, shift.getStatus(), "thiết lập định mức theo vai trò");
        }
        shiftRoleConfigRepositoryPort.deleteByWorkShiftId(shiftId);
        shiftRoleConfigRepositoryPort.flush();
        if (configs != null && !configs.isEmpty()) {
            for (ShiftRoleConfigItemRequest req : configs) {
                if (req.maxSlots() < 1) continue;
                StaffPosition position = staffPositionRepositoryPort.findById(req.positionId())
                        .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy chức vụ id: " + req.positionId()));
                ShiftRoleConfig config = ShiftRoleConfig.builder()
                        .workShift(shift)
                        .position(position)
                        .maxSlots(req.maxSlots())
                        .build();
                shiftRoleConfigRepositoryPort.save(config);
            }
        }
        return getRoleConfigsForShift(shiftId);
    }

    @Override
    @Transactional
    public void runAutoFillForShift(Long shiftId) {
        WorkShift shift = getShiftOrThrow(shiftId);
        if (shift.getStatus() != ShiftStatus.OPEN) {
            throw new InvalidShiftStatusException(shiftId, shift.getStatus(), "điền ca theo lịch cố định");
        }
        createDefaultRoleConfigsForShift(shift);
        autoFillFullTime(shift);
    }

    @Override
    @Transactional
    public void finalizeShiftApprovals(Long shiftId) {
        WorkShift shift = getShiftOrThrow(shiftId);
        if (shift.getStatus() != ShiftStatus.OPEN) {
            throw new InvalidShiftStatusException(shiftId, shift.getStatus(), "duyệt lần cuối");
        }
        List<WorkShiftRegistration> registrations = registrationRepositoryPort.findByWorkShiftIdOrderByRegisteredAtAsc(shiftId);
        List<ShiftRoleConfig> configs = shiftRoleConfigRepositoryPort.findByWorkShiftId(shiftId);
        // Chỉ tính người đã xác nhận tham gia: APPROVED + PENDING_LEAVE đã chọn Từ chối nghỉ. PENDING (chờ duyệt) chưa tính.
        Map<Long, Long> confirmedParticipatingByPositionId = new HashMap<>();
        for (WorkShiftRegistration reg : registrations) {
            boolean isConfirmedParticipating = reg.getStatus() == RegistrationStatus.APPROVED
                    || (reg.getStatus() == RegistrationStatus.PENDING_LEAVE && "REJECTED_LEAVE".equals(reg.getLeaveDecision()));
            if (!isConfirmedParticipating) continue;
            StaffPosition role = reg.getRoleAtRegistration();
            if (role == null) continue;
            Long positionId = role.getId();
            confirmedParticipatingByPositionId.merge(positionId, 1L, (a, b) -> a + b);
        }
        for (ShiftRoleConfig config : configs) {
            int maxSlots = config.getMaxSlots();
            if (maxSlots < 1) continue;
            Long positionId = config.getPosition().getId();
            long count = confirmedParticipatingByPositionId.getOrDefault(positionId, 0L);
            if (count < maxSlots) {
                throw new IllegalStateException("Số lượng người trong ca chưa đủ. Thêm người hoặc sửa định mức cho từng vai trò.");
            }
        }
        for (WorkShiftRegistration reg : registrations) {
            if (reg.getStatus() == RegistrationStatus.PENDING_LEAVE) {
                String decision = reg.getLeaveDecision();
                if ("APPROVED_LEAVE".equals(decision)) {
                    reg.setStatus(RegistrationStatus.ON_LEAVE);
                } else {
                    reg.setStatus(RegistrationStatus.APPROVED);
                }
                reg.setLeaveDecision(null);
                registrationRepositoryPort.save(reg);
            } else if (reg.getStatus() == RegistrationStatus.PENDING) {
                reg.setStatus(RegistrationStatus.APPROVED);
                registrationRepositoryPort.save(reg);
            }
        }
        shift.setStatus(ShiftStatus.ASSIGNED);
        workShiftRepositoryPort.save(shift);
    }

    private WorkShift getShiftOrThrow(Long shiftId) {
        return workShiftRepositoryPort.findById(shiftId)
                .filter(s -> !s.isDeleted() && s.isActive())
                .orElseThrow(() -> new ShiftNotFoundException(shiftId));
    }

    private WorkShiftResponse toResponse(WorkShift shift) {
        StaffProfile staff = shift.getStaff();
        return new WorkShiftResponse(
                shift.getId(),
                staff != null ? staff.getId() : null,
                staff != null ? staff.getFullName() : null,
                shift.getStartTime(),
                shift.getEndTime(),
                shift.getStatus(),
                shift.getCheckInTime(),
                shift.getCheckOutTime(),
                shift.getVersion()
        );
    }

    private WorkShiftResponse toResponseFromRegistration(WorkShiftRegistration reg) {
        WorkShift shift = reg.getWorkShift();
        StaffProfile staff = reg.getStaff();
        return new WorkShiftResponse(
                shift.getId(),
                staff.getId(),
                staff.getFullName(),
                shift.getStartTime(),
                shift.getEndTime(),
                shift.getStatus(),
                shift.getCheckInTime(),
                shift.getCheckOutTime(),
                shift.getVersion()
        );
    }

    private WorkShiftRegistrationResponse toRegistrationResponse(WorkShiftRegistration reg) {
        return new WorkShiftRegistrationResponse(
                reg.getId(),
                reg.getWorkShift().getId(),
                reg.getStaff().getId(),
                reg.getStaff().getFullName(),
                reg.getRoleAtRegistration() != null ? reg.getRoleAtRegistration().getName() : null,
                reg.getWorkType(),
                reg.getStatus(),
                reg.getRegisteredAt(),
                reg.getLeaveReason(),
                reg.getLeaveDecision()
        );
    }

    /** Tạo định mức mặc định cho ca nếu chưa có config, dựa trên thứ trong tuần + buổi (sáng/chiều). */
    private void createDefaultRoleConfigsForShift(WorkShift shift) {
        if (!shiftRoleConfigRepositoryPort.findByWorkShiftId(shift.getId()).isEmpty()) {
            return;
        }
        BaseQuotaTemplate quotaTemplate = getShiftQuota(shift.getStartTime());
        List<StaffPosition> positions = staffPositionRepositoryPort.findAllActive();
        for (StaffPosition position : positions) {
            String name = position.getName() != null ? position.getName() : "";
            String lowerName = name.toLowerCase();

            int slots = 0;
            // NV_BH: Nhân viên Bán hàng & Thu ngân
            if (lowerName.contains("bán hàng") || lowerName.contains("thu ngân")) {
                slots = quotaTemplate.getNvBh();
            }
            // NV_SP: Chuyên viên Spa Thú cưng (Groomer)
            else if (lowerName.contains("spa") || lowerName.contains("groomer")) {
                slots = quotaTemplate.getNvSp();
            }
            // NV_CS: Nhân viên Chăm sóc Thú cưng
            else if (lowerName.contains("chăm sóc")) {
                slots = quotaTemplate.getNvCs();
            }

            if (slots > 0) {
                ShiftRoleConfig config = ShiftRoleConfig.builder()
                        .workShift(shift)
                        .position(position)
                        .maxSlots(slots)
                        .build();
                shiftRoleConfigRepositoryPort.save(config);
            }
        }
    }

    /**
     * Tự động điền nhân viên Full-time vào ca theo Lịch cố định (thứ + sáng/chiều + vai trò).
     * Trạng thái mặc định là APPROVED (Đã xếp ca) – Full-time thấy ca ngay trong "Ca của tôi", không cần Admin duyệt.
     * Nếu không có lịch cố định cho slot đó thì không điền ai (Part-time đăng ký bù hoặc admin gán).
     */
    private void autoFillFullTime(WorkShift shift) {
        int dayOfWeek = shift.getStartTime().getDayOfWeek().getValue(); // 1 = Thứ 2, 7 = Chủ nhật
        boolean isAfternoon = shift.getStartTime().getHour() >= 12;

        List<ShiftRoleConfig> configs = shiftRoleConfigRepositoryPort.findByWorkShiftId(shift.getId());
        for (ShiftRoleConfig config : configs) {
            Long positionId = config.getPosition().getId();
            int maxSlots = config.getMaxSlots();
            long occupiedCount = registrationRepositoryPort.countByWorkShiftIdAndPositionIdAndStatusIn(
                    shift.getId(), positionId, List.of(RegistrationStatus.APPROVED, RegistrationStatus.PENDING));

            List<StaffProfile> staffToFill = getStaffToFillByPosition(positionId, dayOfWeek, isAfternoon);

            for (StaffProfile staff : staffToFill) {
                if (occupiedCount >= maxSlots) break;
                if (registrationRepositoryPort.existsByWorkShiftIdAndStaffId(shift.getId(), staff.getId())) continue;
                WorkShiftRegistration reg = WorkShiftRegistration.builder()
                        .workShift(shift)
                        .staff(staff)
                        .roleAtRegistration(config.getPosition())
                        .workType(EmploymentTypeEnum.FULL_TIME)
                        .status(RegistrationStatus.APPROVED)
                        .registeredAt(LocalDateTime.now())
                        .build();
                registrationRepositoryPort.save(reg);
                occupiedCount++;
            }
        }
    }

    /**
     * Lấy danh sách nhân viên để điền vào ca cho một vai trò.
     * Chỉ dùng lịch cố định: nếu có bản ghi (positionId, dayOfWeek, isAfternoon) thì điền đúng danh sách đó (Full-time, active).
     * Nếu không có lịch cố định cho slot đó thì trả về rỗng – không điền ai, tránh điền lại người đã bị xóa khỏi lịch cố định.
     */
    private List<StaffProfile> getStaffToFillByPosition(Long positionId, int dayOfWeek, boolean isAfternoon) {
        List<StaffFixedSchedule> fixedSchedules = staffFixedScheduleRepositoryPort
                .findByPositionIdAndDayOfWeekAndIsAfternoon(positionId, dayOfWeek, isAfternoon);
        if (fixedSchedules == null || fixedSchedules.isEmpty()) {
            return List.of();
        }
        return fixedSchedules.stream()
                .map(StaffFixedSchedule::getStaff)
                .filter(s -> s != null && s.isActive() && !s.isDeleted()
                        && s.getEmploymentType() == EmploymentTypeEnum.FULL_TIME)
                .distinct()
                .toList();
    }

    @Override
    @Transactional
    public void cancelAdminRegistration(Long shiftId, Long registrationId) {
        WorkShift shift = getShiftOrThrow(shiftId);
        if (shift.getStatus() != ShiftStatus.OPEN) {
            throw new InvalidShiftStatusException(shiftId, shift.getStatus(), "hủy xếp ca (ca đã khóa)");
        }
        WorkShiftRegistration reg = registrationRepositoryPort.findById(registrationId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy đăng ký ca #" + registrationId));
        if (!reg.getWorkShift().getId().equals(shiftId)) {
            throw new IllegalArgumentException("Đăng ký này không thuộc ca làm việc #" + shiftId);
        }
        reg.setStatus(RegistrationStatus.REJECTED);
        registrationRepositoryPort.save(reg);
    }

    @Override
    public WorkShiftBookingPetServicePoolResponse getAssignableBookingPetServices(Instant from, Instant to) {
        if (from == null || to == null) {
            return new WorkShiftBookingPetServicePoolResponse(List.of(), List.of());
        }
        LocalDate weekStart = from.atZone(VIETNAM).toLocalDate();
        LocalDate weekEnd = to.atZone(VIETNAM).toLocalDate();
        List<WorkShiftBookingPetServiceItemResponse> inWeek = new ArrayList<>();
        List<WorkShiftBookingPetServiceItemResponse> waiting = new ArrayList<>();

        for (BookingPetService bps : bookingPetServiceRepository.findAssignableForWorkShift(BookingTypeEnum.WALK_IN)) {
            Booking booking = bps.getBookingPet() != null ? bps.getBookingPet().getBooking() : null;
            if (booking == null) {
                continue;
            }

            LocalDate bookingWeekDate = booking.getBookingDateFrom();
            if (bookingWeekDate == null) {
                continue;
            }

            boolean serviceRequiresRoom =
                    bps.getService() != null && Boolean.TRUE.equals(bps.getService().getIsRequiredRoom());
            Integer requiredStaffCount =
                    bps.getService() != null ? bps.getService().getRequiredStaffCount() : null;
            WorkShiftBookingPetServiceItemResponse item = new WorkShiftBookingPetServiceItemResponse(
                    bps.getId(),
                    booking.getBookingCode(),
                    booking.getId(),
                    booking.getCustomerName(),
                    bps.getBookingPet() != null ? bps.getBookingPet().getPetName() : null,
                    bps.getServiceCombo() != null
                            ? bps.getServiceCombo().getComboName()
                            : (bps.getService() != null ? bps.getService().getServiceName() : null),
                    bookingWeekDate,
                    bps.getScheduledStartTime(),
                    bps.getScheduledEndTime(),
                    serviceRequiresRoom,
                    booking.getBookingCheckInDate(),
                    requiredStaffCount);

            if (!bookingWeekDate.isBefore(weekStart) && !bookingWeekDate.isAfter(weekEnd)) {
                inWeek.add(item);
            } else if (bookingWeekDate.isAfter(weekEnd)) {
                waiting.add(item);
            }
        }

        return new WorkShiftBookingPetServicePoolResponse(inWeek, waiting);
    }

    @Override
    @Transactional
    public void assignBookingPetServiceToShift(Long shiftId, Long bookingPetServiceId, List<Long> staffIds) {
        workShiftBookingAssignmentHelper.assignBookingPetServiceToShift(shiftId, bookingPetServiceId, staffIds);
    }

    @Override
    @Transactional
    public void assignBookingPetServiceToShiftAuto(Long bookingPetServiceId, List<Long> staffIds) {
        workShiftBookingAssignmentHelper.assignBookingPetServiceToShiftAuto(bookingPetServiceId, staffIds);
    }

    @Override
    public WorkShiftAssignOptionsResponse getAssignOptionsForBookingPetService(Long bookingPetServiceId) {
        return workShiftBookingAssignmentHelper.getAssignOptionsForBookingPetService(bookingPetServiceId);
    }

    @Override
    public List<WorkShiftAssignedBookingPetServiceResponse> getBookingPetServicesAssignedToShift(Long shiftId) {
        WorkShift shift = getShiftOrThrow(shiftId);
        List<BookingPetService> overlapping =
                bookingPetServiceRepository.findScheduledOverlappingShift(shift.getStartTime(), shift.getEndTime());
        return overlapping.stream()
                .map(bps -> {
                    Booking booking = bps.getBookingPet() != null ? bps.getBookingPet().getBooking() : null;
                    String assignedNames = null;
                    if (bps.getAssignedStaff() != null && !bps.getAssignedStaff().isEmpty()) {
                        assignedNames = bps.getAssignedStaff().stream()
                                .map(s -> s.getFullName())
                                .filter(Objects::nonNull)
                                .collect(Collectors.joining(", "));
                    }
                    return new WorkShiftAssignedBookingPetServiceResponse(
                            bps.getId(),
                            booking != null ? booking.getBookingCode() : null,
                            booking != null ? booking.getCustomerName() : null,
                            bps.getBookingPet() != null ? bps.getBookingPet().getPetName() : null,
                            bps.getServiceCombo() != null
                                    ? bps.getServiceCombo().getComboName()
                                    : (bps.getService() != null ? bps.getService().getServiceName() : null),
                            bps.getScheduledStartTime(),
                            bps.getScheduledEndTime(),
                            assignedNames);
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void unassignBookingPetService(Long bookingPetServiceId) {
        if (!bookingPetServiceRepository.isEligibleForWorkShiftAssignment(bookingPetServiceId, BookingTypeEnum.WALK_IN)) {
            throw new IllegalStateException("booking_pet_service không đủ điều kiện thao tác.");
        }
        BookingPetService bps = bookingPetServiceRepository.findByIdWithRelationsForWorkShiftAssign(bookingPetServiceId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy booking_pet_service #" + bookingPetServiceId));
        bps.setScheduledStartTime(null);
        bps.setScheduledEndTime(null);
        bps.getAssignedStaff().clear();
        bookingPetServiceRepository.save(bps);
    }

    @Override
    public List<WorkShiftCoverageDayResponse> getShiftCoverageForBookingForm(LocalDate from, LocalDate to) {
        if (from == null || to == null) {
            throw new IllegalArgumentException("Tham số from và to là bắt buộc.");
        }
        if (to.isBefore(from)) {
            throw new IllegalArgumentException("Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.");
        }
        long spanDays = ChronoUnit.DAYS.between(from, to) + 1;
        if (spanDays > 62) {
            throw new IllegalArgumentException("Khoảng ngày tối đa 62 ngày.");
        }

        LocalDateTime rangeStart = from.atStartOfDay();
        LocalDateTime rangeEnd = to.plusDays(1).atStartOfDay();
        List<WorkShift> shifts = workShiftRepositoryPort.findOverlapping(rangeStart, rangeEnd, null);

        List<WorkShiftCoverageDayResponse> result = new ArrayList<>();
        for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
            LocalDateTime morningStart = d.atStartOfDay();
            LocalDateTime morningEnd = d.atTime(12, 0);
            LocalDateTime afternoonStart = d.atTime(12, 0);
            LocalDateTime afternoonEnd = d.plusDays(1).atStartOfDay();

            boolean morning = false;
            boolean afternoon = false;
            for (WorkShift ws : shifts) {
                if (ws.getStartTime() == null || ws.getEndTime() == null) {
                    continue;
                }
                LocalDateTime s = ws.getStartTime();
                LocalDateTime e = ws.getEndTime();
                if (s.isBefore(morningEnd) && e.isAfter(morningStart)) {
                    morning = true;
                }
                if (s.isBefore(afternoonEnd) && e.isAfter(afternoonStart)) {
                    afternoon = true;
                }
                if (morning && afternoon) {
                    break;
                }
            }
            result.add(new WorkShiftCoverageDayResponse(d.toString(), morning, afternoon));
        }
        return result;
    }
}
