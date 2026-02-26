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
import fpt.teddypet.domain.exception.ShiftNotFoundException;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WorkShiftApplicationService implements WorkShiftService {

    private final WorkShiftRepositoryPort workShiftRepositoryPort;
    private final WorkShiftRegistrationRepositoryPort registrationRepositoryPort;
    private final StaffProfileRepositoryPort staffProfileRepositoryPort;

    @Override
    @Transactional
    public WorkShiftResponse createOpenShift(OpenShiftRequest request) {
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
