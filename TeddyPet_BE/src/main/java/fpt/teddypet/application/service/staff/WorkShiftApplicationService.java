package fpt.teddypet.application.service.staff;

import fpt.teddypet.application.dto.request.staff.OpenShiftRequest;
import fpt.teddypet.application.dto.response.staff.WorkShiftRegistrationResponse;
import fpt.teddypet.application.dto.response.staff.WorkShiftResponse;
import fpt.teddypet.application.port.input.staff.WorkShiftService;
import fpt.teddypet.application.port.output.staff.StaffProfileRepositoryPort;
import fpt.teddypet.application.port.output.staff.WorkShiftRegistrationRepositoryPort;
import fpt.teddypet.application.port.output.staff.WorkShiftRepositoryPort;
import fpt.teddypet.domain.entity.staff.StaffProfile;
import fpt.teddypet.domain.entity.staff.WorkShift;
import fpt.teddypet.domain.entity.staff.WorkShiftRegistration;
import fpt.teddypet.domain.enums.staff.RegistrationStatus;
import fpt.teddypet.domain.enums.staff.ShiftStatus;
import fpt.teddypet.domain.exception.AlreadyRegisteredException;
import fpt.teddypet.domain.exception.InvalidShiftStatusException;
import fpt.teddypet.domain.exception.ShiftMustBeNextWeekException;
import fpt.teddypet.domain.exception.ShiftNotFoundException;
import fpt.teddypet.domain.exception.ShiftOverlapException;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WorkShiftApplicationService implements WorkShiftService {

    private final WorkShiftRepositoryPort workShiftRepositoryPort;
    private final WorkShiftRegistrationRepositoryPort registrationRepositoryPort;
    private final StaffProfileRepositoryPort staffProfileRepositoryPort;

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
    @Transactional
    public WorkShiftRegistrationResponse registerForShift(Long shiftId, Long staffId) {
        WorkShift shift = getShiftOrThrow(shiftId);
        if (shift.getStatus() != ShiftStatus.OPEN) {
            throw new InvalidShiftStatusException(shiftId, shift.getStatus(), "đăng ký ca");
        }
        if (registrationRepositoryPort.existsByWorkShiftIdAndStaffId(shiftId, staffId)) {
            throw new AlreadyRegisteredException(shiftId, staffId);
        }

        StaffProfile staff = staffProfileRepositoryPort.findById(staffId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy nhân viên với id: " + staffId));

        WorkShiftRegistration registration = WorkShiftRegistration.builder()
                .workShift(shift)
                .staff(staff)
                .status(RegistrationStatus.PENDING)
                .registeredAt(LocalDateTime.now())
                .build();
        WorkShiftRegistration saved = registrationRepositoryPort.save(registration);
        return toRegistrationResponse(saved);
    }

    @Override
    public List<WorkShiftRegistrationResponse> getRegistrationsForShift(Long shiftId) {
        WorkShift shift = getShiftOrThrow(shiftId);
        return registrationRepositoryPort.findByWorkShiftIdOrderByRegisteredAtAsc(shift.getId())
                .stream()
                .map(this::toRegistrationResponse)
                .toList();
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

        // Duyệt đăng ký đã chọn
        approvedReg.setStatus(RegistrationStatus.APPROVED);
        registrationRepositoryPort.save(approvedReg);

        // Reject tất cả các đăng ký khác
        registrationRepositoryPort.findByWorkShiftIdOrderByRegisteredAtAsc(shiftId)
                .stream()
                .filter(r -> !r.getId().equals(registrationId))
                .forEach(r -> {
                    r.setStatus(RegistrationStatus.REJECTED);
                    registrationRepositoryPort.save(r);
                });

        // Gán nhân viên cho ca, cập nhật status
        shift.setStaff(approvedReg.getStaff());
        shift.setStatus(ShiftStatus.ASSIGNED);
        WorkShift saved = workShiftRepositoryPort.save(shift);
        return toResponse(saved);
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
        return workShiftRepositoryPort.findByStaffIdAndStartTimeBetween(staffId, from, to)
                .stream()
                .map(this::toResponse)
                .toList();
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

    private WorkShiftRegistrationResponse toRegistrationResponse(WorkShiftRegistration reg) {
        return new WorkShiftRegistrationResponse(
                reg.getId(),
                reg.getWorkShift().getId(),
                reg.getStaff().getId(),
                reg.getStaff().getFullName(),
                reg.getStatus(),
                reg.getRegisteredAt()
        );
    }
}
