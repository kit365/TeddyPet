package fpt.teddypet.application.service.staff;

import fpt.teddypet.application.dto.response.staff.StaffShiftOptionResponse;
import fpt.teddypet.application.dto.response.staff.WorkShiftAssignOptionsResponse;
import fpt.teddypet.application.port.output.shop.TimeSlotRepositoryPort;
import fpt.teddypet.application.port.output.staff.StaffSkillRepositoryPort;
import fpt.teddypet.application.port.output.staff.StaffProfileRepositoryPort;
import fpt.teddypet.application.port.output.staff.WorkShiftRegistrationRepositoryPort;
import fpt.teddypet.application.port.output.staff.WorkShiftRepositoryPort;
import fpt.teddypet.domain.entity.Booking;
import fpt.teddypet.domain.entity.BookingPetService;
import fpt.teddypet.domain.entity.Service;
import fpt.teddypet.domain.entity.TimeSlot;
import fpt.teddypet.domain.entity.staff.StaffProfile;
import fpt.teddypet.domain.entity.staff.WorkShift;
import fpt.teddypet.domain.entity.staff.WorkShiftRegistration;
import fpt.teddypet.domain.enums.staff.RegistrationStatus;
import fpt.teddypet.domain.enums.staff.ShiftStatus;
import fpt.teddypet.domain.exception.InvalidShiftStatusException;
import fpt.teddypet.domain.exception.ShiftNotFoundException;
import fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.BookingPetServiceRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Logic gán booking_pet_service vào ca (ASSIGNED) + chọn nhân viên — tách khỏi {@link WorkShiftApplicationService} để dễ bảo trì.
 */
@Component
@RequiredArgsConstructor
public class WorkShiftBookingAssignmentHelper {

    private final WorkShiftRepositoryPort workShiftRepositoryPort;
    private final WorkShiftRegistrationRepositoryPort registrationRepositoryPort;
    private final StaffProfileRepositoryPort staffProfileRepositoryPort;
    private final StaffSkillRepositoryPort staffSkillRepositoryPort;
    private final TimeSlotRepositoryPort timeSlotRepositoryPort;
    private final BookingPetServiceRepository bookingPetServiceRepository;

    /**
     * @param shiftId nếu null: tự resolve ca theo phòng / ngày dịch vụ; nếu có: admin chọn ca (phòng: ngày+buổi;
     *          dịch vụ không phòng: cùng ngày lịch — không bắt trùng khung giờ với slot khách).
     */
    @Transactional(readOnly = true)
    public WorkShiftAssignOptionsResponse getAssignOptionsForBookingPetService(Long bookingPetServiceId, Long shiftId) {
        BookingPetService bps = bookingPetServiceRepository.findByIdWithRelationsForWorkShiftAssign(bookingPetServiceId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy booking_pet_service #" + bookingPetServiceId));
        if (!bookingPetServiceRepository.isEligibleForWorkShiftAssignment(bookingPetServiceId)) {
            throw new IllegalStateException("booking_pet_service không đủ điều kiện để xếp ca.");
        }
        if (bps.getServiceCombo() != null && bps.getService() == null) {
            throw new IllegalArgumentException("Dịch vụ combo chưa hỗ trợ xếp ca tự động.");
        }
        Booking booking = bps.getBookingPet() != null ? bps.getBookingPet().getBooking() : null;
        if (booking == null) {
            throw new IllegalArgumentException("Không tìm thấy booking cho booking_pet_service.");
        }
        Service svc = bps.getService();
        if (svc == null) {
            throw new IllegalArgumentException("Thiếu thông tin dịch vụ để xếp ca.");
        }
        WorkShift shift;
        if (shiftId == null) {
            shift = Boolean.TRUE.equals(svc.getIsRequiredRoom())
                    ? resolveAssignedShiftForRoomService(booking)
                    : resolveAssignedShiftForNonRoomService(booking, bps);
        } else {
            shift = getShiftOrThrow(shiftId);
            if (!isShiftOpenOrAssigned(shift)) {
                throw new InvalidShiftStatusException(
                        shiftId,
                        shift.getStatus(),
                        "xem trước xếp ca (chỉ ca OPEN hoặc ASSIGNED)");
            }
            validateAdminChosenShift(shift, booking, bps, svc);
        }
        List<StaffShiftOptionResponse> participating = listParticipatingStaffOptions(shift.getId(), svc);
        int required = effectiveRequiredStaffCount(svc);
        boolean shortage = required > participating.size();
        return new WorkShiftAssignOptionsResponse(required, shift.getId(), shortage, participating);
    }

    @Transactional
    public void assignBookingPetServiceToShift(Long shiftId, Long bookingPetServiceId, List<Long> staffIds) {
        WorkShift shift = getShiftOrThrow(shiftId);
        if (!isShiftOpenOrAssigned(shift)) {
            throw new InvalidShiftStatusException(
                    shiftId,
                    shift.getStatus(),
                    "gán booking_pet_service vào ca (chỉ khi ca đang OPEN hoặc ASSIGNED)");
        }
        if (!bookingPetServiceRepository.isEligibleForWorkShiftAssignment(bookingPetServiceId)) {
            throw new IllegalStateException("booking_pet_service không đủ điều kiện để xếp ca.");
        }
        BookingPetService bps = bookingPetServiceRepository.findByIdWithRelationsForWorkShiftAssign(bookingPetServiceId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy booking_pet_service #" + bookingPetServiceId));
        if (bps.getServiceCombo() != null && bps.getService() == null) {
            throw new IllegalArgumentException("Dịch vụ combo chưa hỗ trợ xếp ca tự động.");
        }
        Booking booking = bps.getBookingPet() != null ? bps.getBookingPet().getBooking() : null;
        if (booking == null) {
            throw new IllegalArgumentException("Không tìm thấy booking cho booking_pet_service.");
        }
        Service svc = bps.getService();
        if (svc == null) {
            throw new IllegalArgumentException("Thiếu thông tin dịch vụ để xếp ca.");
        }
        validateAdminChosenShift(shift, booking, bps, svc);
        validateStaffSelections(shift.getId(), staffIds, svc);
        if (Boolean.TRUE.equals(svc.getIsRequiredRoom())) {
            assignRoomServiceToShift(shift, bps, booking);
        } else {
            assignNonRoomServiceToShift(shift, bps, booking);
        }
        applyStaffToBookingPetService(bps, staffIds);
        bookingPetServiceRepository.save(bps);
    }

    @Transactional
    public void assignBookingPetServiceToShiftAuto(Long bookingPetServiceId, List<Long> staffIds) {
        if (!bookingPetServiceRepository.isEligibleForWorkShiftAssignment(bookingPetServiceId)) {
            throw new IllegalStateException("booking_pet_service không đủ điều kiện để xếp ca.");
        }
        BookingPetService bps = bookingPetServiceRepository.findByIdWithRelationsForWorkShiftAssign(bookingPetServiceId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy booking_pet_service #" + bookingPetServiceId));
        if (bps.getServiceCombo() != null && bps.getService() == null) {
            throw new IllegalArgumentException("Dịch vụ combo chưa hỗ trợ xếp ca tự động.");
        }
        Booking booking = bps.getBookingPet() != null ? bps.getBookingPet().getBooking() : null;
        if (booking == null) {
            throw new IllegalArgumentException("Không tìm thấy booking cho booking_pet_service.");
        }
        Service svc = bps.getService();
        if (svc == null) {
            throw new IllegalArgumentException("Thiếu thông tin dịch vụ để xếp ca.");
        }
        WorkShift shift = Boolean.TRUE.equals(svc.getIsRequiredRoom())
                ? resolveAssignedShiftForRoomService(booking)
                : resolveAssignedShiftForNonRoomService(booking, bps);
        validateStaffSelections(shift.getId(), staffIds, svc);
        if (Boolean.TRUE.equals(svc.getIsRequiredRoom())) {
            assignRoomServiceToShift(shift, bps, booking);
        } else {
            assignNonRoomServiceToShift(shift, bps, booking);
        }
        applyStaffToBookingPetService(bps, staffIds);
        bookingPetServiceRepository.save(bps);
    }

    private WorkShift getShiftOrThrow(Long shiftId) {
        return workShiftRepositoryPort.findById(shiftId)
                .filter(s -> !s.isDeleted() && s.isActive())
                .orElseThrow(() -> new ShiftNotFoundException(shiftId));
    }

    /** Ca còn xếp booking: đang tuyển (OPEN) hoặc đã khóa (ASSIGNED). */
    private static boolean isShiftOpenOrAssigned(WorkShift ws) {
        if (ws == null) {
            return false;
        }
        ShiftStatus s = ws.getStatus();
        return s == ShiftStatus.OPEN || s == ShiftStatus.ASSIGNED;
    }

    /**
     * Admin chọn ca theo ngày + buổi (sáng/chiều). Phòng: nếu đã check-in thì khớp giờ check-in; nếu chưa — khớp ngày đặt / dự kiến.
     * Dịch vụ không phòng ({@code isRequiredRoom=false}): chỉ cần ca cùng ngày với ngày lịch, không xét overlap khung giờ.
     */
    private void validateAdminChosenShift(WorkShift shift, Booking booking, BookingPetService bps, Service svc) {
        if (Boolean.TRUE.equals(svc.getIsRequiredRoom())) {
            LocalDateTime checkIn = booking.getBookingCheckInDate();
            if (checkIn != null) {
                if (!isRoomShiftCompatibleWithCheckIn(shift, checkIn)) {
                    throw new IllegalArgumentException(
                            "Ca không khớp ngày hoặc buổi (sáng/chiều) theo giờ check-in.");
                }
            } else {
                validateRoomShiftMatchesSchedulingDate(shift, booking, bps);
            }
        } else {
            Long tsId = bps.getTimeSlotId();
            if (tsId != null) {
                timeSlotRepositoryPort.findById(tsId)
                        .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy khung giờ: " + tsId));
                LocalDate schedulingDate = resolveSchedulingDateForWorkShiftPool(booking, bps);
                if (schedulingDate == null) {
                    throw new IllegalArgumentException("Không xác định được ngày để áp khung giờ dịch vụ.");
                }
                if (!shift.getStartTime().toLocalDate().equals(schedulingDate)) {
                    throw new IllegalArgumentException("Ca không cùng ngày với ngày dịch vụ.");
                }
            } else {
                validateNonRoomShiftWithoutTimeSlot(shift, booking, bps);
            }
        }
    }

    /**
     * Dịch vụ không phòng không bắt buộc {@code time_slot}: dùng lịch đã có trên BPS hoặc ngày đặt/dự kiến + ca admin chọn.
     */
    private void validateNonRoomShiftWithoutTimeSlot(WorkShift shift, Booking booking, BookingPetService bps) {
        LocalDate schedulingDate = resolveSchedulingDateForWorkShiftPool(booking, bps);
        if (schedulingDate == null) {
            throw new IllegalArgumentException("Không xác định được ngày dịch vụ để xếp ca.");
        }
        if (bps.getScheduledStartTime() != null && bps.getScheduledEndTime() != null) {
            LocalDateTime wStart = bps.getScheduledStartTime();
            if (!shift.getStartTime().toLocalDate().equals(wStart.toLocalDate())) {
                throw new IllegalArgumentException("Ca không cùng ngày với lịch dịch vụ.");
            }
            return;
        }
        if (shift.getStartTime() == null || !shift.getStartTime().toLocalDate().equals(schedulingDate)) {
            throw new IllegalArgumentException("Ca không cùng ngày với ngày đặt / dự kiến dịch vụ.");
        }
    }

    private static int effectiveRequiredStaffCount(Service svc) {
        Integer r = svc.getRequiredStaffCount();
        return r != null && r > 0 ? r : 1;
    }

    private static boolean isConfirmedParticipating(WorkShiftRegistration reg) {
        return reg.getStatus() == RegistrationStatus.APPROVED
                || (reg.getStatus() == RegistrationStatus.PENDING_LEAVE && "REJECTED_LEAVE".equals(reg.getLeaveDecision()));
    }

    private List<StaffShiftOptionResponse> listParticipatingStaffOptions(Long shiftId, Service svc) {
        List<WorkShiftRegistration> registrations =
                registrationRepositoryPort.findByWorkShiftIdOrderByRegisteredAtAsc(shiftId);
        List<StaffShiftOptionResponse> base = registrations.stream()
                .filter(WorkShiftBookingAssignmentHelper::isConfirmedParticipating)
                .map(reg -> new StaffShiftOptionResponse(
                        reg.getStaff().getId(),
                        reg.getStaff().getFullName(),
                        reg.getRoleAtRegistration() != null ? reg.getRoleAtRegistration().getName() : null))
                .collect(Collectors.toList());
        if (svc == null || svc.getSkill() == null) {
            return base;
        }
        Long skillId = svc.getSkill().getId();
        Set<Long> staffIds = base.stream().map(StaffShiftOptionResponse::staffId).collect(Collectors.toSet());
        if (staffIds.isEmpty()) {
            return base;
        }
        Set<Long> eligible = new HashSet<>(staffSkillRepositoryPort.findStaffIdsHavingSkill(skillId, staffIds));
        return base.stream()
                .filter(o -> eligible.contains(o.staffId()))
                .collect(Collectors.toList());
    }

    private void validateStaffSelections(Long shiftId, List<Long> staffIds, Service svc) {
        if (staffIds == null || staffIds.isEmpty()) {
            throw new IllegalArgumentException("Chọn ít nhất một nhân viên trong ca.");
        }
        long distinct = staffIds.stream().distinct().count();
        if (distinct != staffIds.size()) {
            throw new IllegalArgumentException("Không được chọn trùng nhân viên.");
        }
        List<StaffShiftOptionResponse> participating = listParticipatingStaffOptions(shiftId, svc);
        Set<Long> allowed = participating.stream().map(StaffShiftOptionResponse::staffId).collect(Collectors.toSet());
        if (allowed.isEmpty()) {
            throw new IllegalArgumentException(svc.getSkill() != null
                    ? "Không có nhân viên trong ca có kỹ năng phù hợp với dịch vụ này."
                    : "Ca không có nhân viên đã xác nhận tham gia.");
        }
        for (Long sid : staffIds) {
            if (!allowed.contains(sid)) {
                throw new IllegalArgumentException("Nhân viên #" + sid + " không thuộc ca này.");
            }
        }
        int required = effectiveRequiredStaffCount(svc);
        boolean shortage = required > participating.size();
        int expectedSize = shortage ? participating.size() : required;
        if (staffIds.size() != expectedSize) {
            throw new IllegalArgumentException(shortage
                    ? "Cần chọn đủ " + expectedSize + " nhân viên (toàn bộ nhân viên trong ca) khi thiếu so với yêu cầu."
                    : "Cần chọn đúng " + required + " nhân viên theo dịch vụ.");
        }
    }

    private void applyStaffToBookingPetService(BookingPetService bps, List<Long> staffIds) {
        bps.getAssignedStaff().clear();
        for (Long sid : staffIds) {
            StaffProfile sp = staffProfileRepositoryPort.findById(sid)
                    .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy nhân viên #" + sid));
            bps.getAssignedStaff().add(sp);
        }
    }

    private WorkShift resolveAssignedShiftForRoomService(Booking booking) {
        LocalDateTime checkIn = booking.getBookingCheckInDate();
        if (checkIn == null) {
            throw new IllegalArgumentException(
                    "Dịch vụ phòng: cần thời điểm check-in booking để xếp buổi sáng/chiều.");
        }
        LocalDate checkInDate = checkIn.toLocalDate();
        LocalDateTime dayStart = checkInDate.atStartOfDay();
        LocalDateTime dayEnd = LocalDateTime.of(checkInDate, LocalTime.MAX);
        List<WorkShift> sameDay = workShiftRepositoryPort.findByStartTimeBetween(dayStart, dayEnd).stream()
                .filter(WorkShiftBookingAssignmentHelper::isShiftOpenOrAssigned)
                .filter(ws -> ws.getStartTime() != null && ws.getEndTime() != null)
                .filter(ws -> ws.getStartTime().toLocalDate().equals(checkInDate))
                .sorted(Comparator.comparing(WorkShift::getStartTime).thenComparing(WorkShift::getId))
                .toList();
        if (sameDay.isEmpty()) {
            throw new IllegalArgumentException(
                    "Không có ca (OPEN hoặc đã khóa) trong ngày check-in. Hãy tạo ca cho ngày đó.");
        }
        for (WorkShift ws : sameDay) {
            if (!checkIn.isBefore(ws.getStartTime()) && !checkIn.isAfter(ws.getEndTime())) {
                return ws;
            }
        }
        int expectedSlot = slotIndexFromDateTime(checkIn);
        List<WorkShift> bySlot = sameDay.stream()
                .filter(ws -> slotIndexFromDateTime(ws.getStartTime()) == expectedSlot)
                .toList();
        if (!bySlot.isEmpty()) {
            return bySlot.get(bySlot.size() - 1);
        }
        throw new IllegalArgumentException(
                "Không có ca (OPEN hoặc đã khóa) trùng buổi (sáng/chiều) với giờ check-in trong ngày này.");
    }

    private WorkShift resolveAssignedShiftForNonRoomService(Booking booking, BookingPetService bps) {
        Long tsId = bps.getTimeSlotId();
        if (tsId != null) {
            TimeSlot slot = timeSlotRepositoryPort.findById(tsId)
                    .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy khung giờ: " + tsId));
            LocalDate schedulingDate = resolveSchedulingDateForWorkShiftPool(booking, bps);
            if (schedulingDate == null) {
                throw new IllegalArgumentException("Không xác định được ngày để áp khung giờ dịch vụ.");
            }
            LocalDateTime dayStartTs = schedulingDate.atStartOfDay();
            LocalDateTime dayEndTs = LocalDateTime.of(schedulingDate, LocalTime.MAX);
            List<WorkShift> sameDayFromSlot = workShiftRepositoryPort.findByStartTimeBetween(dayStartTs, dayEndTs).stream()
                    .filter(WorkShiftBookingAssignmentHelper::isShiftOpenOrAssigned)
                    .filter(ws -> ws.getStartTime() != null && ws.getEndTime() != null)
                    .filter(ws -> ws.getStartTime().toLocalDate().equals(schedulingDate))
                    .sorted(Comparator.comparing(WorkShift::getStartTime).thenComparing(WorkShift::getId))
                    .toList();
            if (sameDayFromSlot.isEmpty()) {
                throw new IllegalArgumentException("Không có ca (OPEN hoặc đã khóa) trong ngày dịch vụ.");
            }
            return sameDayFromSlot.get(0);
        }

        LocalDate schedulingDate = resolveSchedulingDateForWorkShiftPool(booking, bps);
        if (schedulingDate == null) {
            throw new IllegalArgumentException("Không xác định được ngày dịch vụ để xếp ca.");
        }
        if (bps.getScheduledStartTime() != null && bps.getScheduledEndTime() != null) {
            LocalDateTime dayStartSched = schedulingDate.atStartOfDay();
            LocalDateTime dayEndSched = LocalDateTime.of(schedulingDate, LocalTime.MAX);
            List<WorkShift> sameDayFromSched = workShiftRepositoryPort.findByStartTimeBetween(dayStartSched, dayEndSched).stream()
                    .filter(WorkShiftBookingAssignmentHelper::isShiftOpenOrAssigned)
                    .filter(ws -> ws.getStartTime() != null && ws.getEndTime() != null)
                    .filter(ws -> ws.getStartTime().toLocalDate().equals(schedulingDate))
                    .sorted(Comparator.comparing(WorkShift::getStartTime).thenComparing(WorkShift::getId))
                    .toList();
            if (sameDayFromSched.isEmpty()) {
                throw new IllegalArgumentException("Không có ca (OPEN hoặc đã khóa) trong ngày dịch vụ.");
            }
            return sameDayFromSched.get(0);
        }

        LocalDateTime dayStart = schedulingDate.atStartOfDay();
        LocalDateTime dayEnd = LocalDateTime.of(schedulingDate, LocalTime.MAX);
        List<WorkShift> sameDay = workShiftRepositoryPort.findByStartTimeBetween(dayStart, dayEnd).stream()
                .filter(WorkShiftBookingAssignmentHelper::isShiftOpenOrAssigned)
                .filter(ws -> ws.getStartTime() != null && ws.getEndTime() != null)
                .filter(ws -> ws.getStartTime().toLocalDate().equals(schedulingDate))
                .sorted(Comparator.comparing(WorkShift::getStartTime).thenComparing(WorkShift::getId))
                .toList();
        if (sameDay.isEmpty()) {
            throw new IllegalArgumentException("Không có ca (OPEN hoặc đã khóa) trong ngày dịch vụ.");
        }
        return sameDay.get(0);
    }

    private static LocalDate resolveSchedulingDateForWorkShiftPool(Booking booking, BookingPetService bps) {
        if (bps.getActualCheckInDate() != null) {
            return bps.getActualCheckInDate();
        }
        if (booking != null && booking.getBookingDateFrom() != null) {
            return booking.getBookingDateFrom();
        }
        if (bps.getEstimatedCheckInDate() != null) {
            return bps.getEstimatedCheckInDate();
        }
        if (bps.getScheduledStartTime() != null) {
            return bps.getScheduledStartTime().toLocalDate();
        }
        return null;
    }

    private void assignRoomServiceToShift(WorkShift shift, BookingPetService bps, Booking booking) {
        LocalDateTime checkIn = booking.getBookingCheckInDate();
        if (checkIn != null) {
            if (!isRoomShiftCompatibleWithCheckIn(shift, checkIn)) {
                throw new IllegalArgumentException(
                        "Ca không khớp ngày hoặc buổi (sáng/chiều) theo giờ check-in (kể cả trễ sau giờ kết thúc ca cùng buổi).");
            }
        } else {
            validateRoomShiftMatchesSchedulingDate(shift, booking, bps);
        }
        bps.setScheduledStartTime(shift.getStartTime());
        bps.setScheduledEndTime(shift.getEndTime());
    }

    /** Ca phòng (chưa check-in): cùng ngày với ngày đặt / actual / dự kiến trên dịch vụ. */
    private void validateRoomShiftMatchesSchedulingDate(WorkShift shift, Booking booking, BookingPetService bps) {
        LocalDate schedulingDate = resolveSchedulingDateForWorkShiftPool(booking, bps);
        if (schedulingDate == null) {
            throw new IllegalArgumentException("Không xác định được ngày dịch vụ để xếp ca phòng.");
        }
        if (shift.getStartTime() == null || !shift.getStartTime().toLocalDate().equals(schedulingDate)) {
            throw new IllegalArgumentException("Ca không cùng ngày với ngày đặt / dự kiến dịch vụ.");
        }
    }

    private void assignNonRoomServiceToShift(WorkShift shift, BookingPetService bps, Booking booking) {
        Long tsId = bps.getTimeSlotId();
        if (tsId != null) {
            TimeSlot slot = timeSlotRepositoryPort.findById(tsId)
                    .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy khung giờ: " + tsId));
            LocalDate schedulingDate = resolveSchedulingDateForWorkShiftPool(booking, bps);
            if (schedulingDate == null) {
                throw new IllegalArgumentException("Không xác định được ngày để áp khung giờ dịch vụ.");
            }
            LocalDateTime slotStart = schedulingDate.atTime(slot.getStartTime());
            LocalDateTime slotEndRaw = schedulingDate.atTime(slot.getEndTime());
            final LocalDateTime slotEnd = !slotEndRaw.isAfter(slotStart) ? slotEndRaw.plusDays(1) : slotEndRaw;
            if (!shift.getStartTime().toLocalDate().equals(schedulingDate)) {
                throw new IllegalArgumentException("Ca không cùng ngày với ngày dịch vụ.");
            }
            bps.setScheduledStartTime(slotStart);
            bps.setScheduledEndTime(slotEnd);
            return;
        }

        if (bps.getScheduledStartTime() != null && bps.getScheduledEndTime() != null) {
            return;
        }
        bps.setScheduledStartTime(shift.getStartTime());
        bps.setScheduledEndTime(shift.getEndTime());
    }

    private static boolean isRoomShiftCompatibleWithCheckIn(WorkShift shift, LocalDateTime checkIn) {
        if (checkIn == null || shift.getStartTime() == null || shift.getEndTime() == null) {
            return false;
        }
        LocalDate checkInDate = checkIn.toLocalDate();
        if (!shift.getStartTime().toLocalDate().equals(checkInDate)) {
            return false;
        }
        if (!checkIn.isBefore(shift.getStartTime()) && !checkIn.isAfter(shift.getEndTime())) {
            return true;
        }
        return slotIndexFromDateTime(shift.getStartTime()) == slotIndexFromDateTime(checkIn);
    }

    private static int slotIndexFromDateTime(LocalDateTime dt) {
        if (dt == null) {
            return 0;
        }
        return dt.getHour() >= 12 ? 1 : 0;
    }

    private static boolean intervalsOverlap(
            LocalDateTime aStart, LocalDateTime aEnd, LocalDateTime bStart, LocalDateTime bEnd) {
        return aStart.isBefore(bEnd) && bStart.isBefore(aEnd);
    }
}
