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
import fpt.teddypet.domain.enums.bookings.BookingTypeEnum;
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

    @Transactional(readOnly = true)
    public WorkShiftAssignOptionsResponse getAssignOptionsForBookingPetService(Long bookingPetServiceId) {
        BookingPetService bps = bookingPetServiceRepository.findByIdWithRelationsForWorkShiftAssign(bookingPetServiceId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy booking_pet_service #" + bookingPetServiceId));
        if (!bookingPetServiceRepository.isEligibleForWorkShiftAssignment(bookingPetServiceId, BookingTypeEnum.WALK_IN)) {
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
        WorkShift shift = Boolean.TRUE.equals(svc.getIsRequiredRoom())
                ? resolveAssignedShiftForRoomService(booking)
                : resolveAssignedShiftForNonRoomService(booking, bps);
        List<StaffShiftOptionResponse> participating = listParticipatingStaffOptions(shift.getId(), svc);
        int required = effectiveRequiredStaffCount(svc);
        boolean shortage = required > participating.size();
        return new WorkShiftAssignOptionsResponse(required, shift.getId(), shortage, participating);
    }

    @Transactional
    public void assignBookingPetServiceToShift(Long shiftId, Long bookingPetServiceId, List<Long> staffIds) {
        WorkShift shift = getShiftOrThrow(shiftId);
        if (shift.getStatus() != ShiftStatus.ASSIGNED) {
            throw new InvalidShiftStatusException(
                    shiftId,
                    shift.getStatus(),
                    "gán booking_pet_service vào ca (chỉ khi ca đã duyệt lần cuối — ASSIGNED)");
        }
        if (!bookingPetServiceRepository.isEligibleForWorkShiftAssignment(bookingPetServiceId, BookingTypeEnum.WALK_IN)) {
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
        WorkShift resolved = Boolean.TRUE.equals(svc.getIsRequiredRoom())
                ? resolveAssignedShiftForRoomService(booking)
                : resolveAssignedShiftForNonRoomService(booking, bps);
        if (!shift.getId().equals(resolved.getId())) {
            throw new IllegalArgumentException("Ca được chọn không khớp lịch của booking này.");
        }
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
        if (!bookingPetServiceRepository.isEligibleForWorkShiftAssignment(bookingPetServiceId, BookingTypeEnum.WALK_IN)) {
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
                .filter(ws -> ws.getStatus() == ShiftStatus.ASSIGNED)
                .filter(ws -> ws.getStartTime() != null && ws.getEndTime() != null)
                .filter(ws -> ws.getStartTime().toLocalDate().equals(checkInDate))
                .sorted(Comparator.comparing(WorkShift::getStartTime).thenComparing(WorkShift::getId))
                .toList();
        if (sameDay.isEmpty()) {
            throw new IllegalArgumentException(
                    "Không có ca đã khóa (đã duyệt lần cuối) trong ngày check-in. Hãy tạo và duyệt khóa ca cho ngày đó.");
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
                "Không có ca đã khóa trùng buổi (sáng/chiều) với giờ check-in trong ngày này.");
    }

    private WorkShift resolveAssignedShiftForNonRoomService(Booking booking, BookingPetService bps) {
        Long tsId = bps.getTimeSlotId();
        if (tsId == null) {
            throw new IllegalArgumentException("Dịch vụ không phòng: cần khung giờ (time_slot) để xếp ca.");
        }
        TimeSlot slot = timeSlotRepositoryPort.findById(tsId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy khung giờ: " + tsId));
        LocalDate schedulingDate = resolveSchedulingDateForWorkShiftPool(booking, bps);
        if (schedulingDate == null) {
            throw new IllegalArgumentException("Không xác định được ngày để áp khung giờ dịch vụ.");
        }
        LocalDateTime slotStart = schedulingDate.atTime(slot.getStartTime());
        LocalDateTime slotEndRaw = schedulingDate.atTime(slot.getEndTime());
        final LocalDateTime slotEnd = !slotEndRaw.isAfter(slotStart) ? slotEndRaw.plusDays(1) : slotEndRaw;
        List<WorkShift> overlapping = workShiftRepositoryPort.findOverlapping(slotStart, slotEnd, null);
        List<WorkShift> matches = overlapping.stream()
                .filter(ws -> ws.getStatus() == ShiftStatus.ASSIGNED)
                .filter(ws -> ws.getStartTime().toLocalDate().equals(schedulingDate))
                .filter(ws -> intervalsOverlap(slotStart, slotEnd, ws.getStartTime(), ws.getEndTime()))
                .sorted(Comparator.comparing(WorkShift::getId))
                .toList();
        if (matches.isEmpty()) {
            throw new IllegalArgumentException(
                    "Không có ca đã khóa (đã duyệt lần cuối) trùng khung giờ khách đã chọn.");
        }
        return matches.get(0);
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
        if (checkIn == null) {
            throw new IllegalArgumentException(
                    "Dịch vụ phòng: cần thời điểm check-in booking để xếp buổi sáng/chiều.");
        }
        if (!isRoomShiftCompatibleWithCheckIn(shift, checkIn)) {
            throw new IllegalArgumentException(
                    "Ca không khớp ngày hoặc buổi (sáng/chiều) theo giờ check-in (kể cả trễ sau giờ kết thúc ca cùng buổi).");
        }
        bps.setScheduledStartTime(shift.getStartTime());
        bps.setScheduledEndTime(shift.getEndTime());
    }

    private void assignNonRoomServiceToShift(WorkShift shift, BookingPetService bps, Booking booking) {
        Long tsId = bps.getTimeSlotId();
        if (tsId == null) {
            throw new IllegalArgumentException("Dịch vụ không phòng: cần khung giờ (time_slot) để xếp ca.");
        }
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
        if (!intervalsOverlap(slotStart, slotEnd, shift.getStartTime(), shift.getEndTime())) {
            throw new IllegalArgumentException("Ca không trùng khung giờ khách đã chọn.");
        }
        bps.setScheduledStartTime(slotStart);
        bps.setScheduledEndTime(slotEnd);
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
