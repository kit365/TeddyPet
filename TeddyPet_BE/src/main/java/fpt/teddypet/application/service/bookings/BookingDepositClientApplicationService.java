package fpt.teddypet.application.service.bookings;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import fpt.teddypet.application.dto.request.bookings.CreateBookingPetRequest;
import fpt.teddypet.application.dto.request.bookings.CreateBookingPetServiceRequest;
import fpt.teddypet.application.dto.request.bookings.CreateBookingRequest;
import fpt.teddypet.application.dto.response.bookings.CreateBookingDepositIntentResponse;
import fpt.teddypet.application.dto.response.bookings.CreateBookingResponse;
import fpt.teddypet.application.port.input.bookings.BookingDepositClientService;
import fpt.teddypet.application.port.input.bookings.BookingClientService;
import fpt.teddypet.application.port.output.room.RoomRepositoryPort;
import fpt.teddypet.application.port.output.services.ServiceRepositoryPort;
import fpt.teddypet.application.port.output.shop.TimeSlotRepositoryPort;
import fpt.teddypet.domain.entity.Booking;
import fpt.teddypet.domain.entity.BookingDeposit;
import fpt.teddypet.domain.entity.Room;
import fpt.teddypet.domain.entity.TimeSlot;
import fpt.teddypet.domain.enums.RoomStatusEnum;
import fpt.teddypet.domain.exception.BookingValidationException;
import fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.BookingDepositRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.BookingRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.BookingPetServiceRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.OptimisticLockException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
public class BookingDepositClientApplicationService implements BookingDepositClientService {

    private static final int HOLD_MINUTES = 5;

    private final BookingDepositRepository bookingDepositRepository;
    private final BookingPetServiceRepository bookingPetServiceRepository;
    private final BookingRepository bookingRepository;
    private final BookingClientService bookingClientService;
    private final ServiceRepositoryPort serviceRepositoryPort;
    private final RoomRepositoryPort roomRepositoryPort;
    private final TimeSlotRepositoryPort timeSlotRepositoryPort;
    private final ObjectMapper objectMapper;

    @Override
    public CreateBookingDepositIntentResponse createDepositIntent(CreateBookingRequest request) {
        if (request.pets() == null || request.pets().isEmpty()) {
            throw new IllegalArgumentException("Vui lòng chọn ít nhất một thú cưng và dịch vụ.");
        }

        // validate service active (main + add-on)
        validateServicesActive(request);

        // reserve resources (rooms / time slots) for 5 minutes
        ObjectNode holdPayload = reserveResources(request);

        // tạo booking tạm thời (không tăng currentBookings lần nữa)
        CreateBookingResponse bookingResponse = bookingClientService.createBookingWithoutTimeSlotIncrement(request);
        Booking booking = bookingRepository.findByBookingCode(bookingResponse.bookingCode())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy booking với mã: " + bookingResponse.bookingCode()));
        booking.setIsTemporary(true);
        bookingRepository.save(booking);

        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(HOLD_MINUTES);

        try {
            String draftJson = objectMapper.writeValueAsString(request);
            String holdPayloadJson = objectMapper.writeValueAsString(holdPayload);

            BookingDeposit deposit = BookingDeposit.builder()
                    .bookingId(booking.getId())
                    .bookingCode(booking.getBookingCode())
                    .status("PENDING")
                    .expiresAt(expiresAt)
                    .bookingDraftJson(draftJson)
                    .holdPayloadJson(holdPayloadJson)
                    .build();

            BookingDeposit saved = bookingDepositRepository.save(deposit);
            return new CreateBookingDepositIntentResponse(
                    saved.getId(),
                    saved.getExpiresAt(),
                    booking.getId(),
                    booking.getBookingCode()
            );
        } catch (Exception e) {
            throw new IllegalStateException("Không thể tạo giữ chỗ: " + e.getMessage(), e);
        }
    }

    @Override
    public CreateBookingResponse confirmDepositAndCreateBooking(Long depositId) {
        BookingDeposit deposit = bookingDepositRepository.findById(depositId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy giữ chỗ với id: " + depositId));

        if (!"PENDING".equalsIgnoreCase(deposit.getStatus())) {
            throw new IllegalStateException("Giữ chỗ đã được xử lý hoặc hết hạn.");
        }
        if (deposit.getExpiresAt() != null && deposit.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalStateException("Giữ chỗ đã hết hạn. Vui lòng chọn lại dịch vụ.");
        }
        if (deposit.getBookingId() == null) {
            throw new IllegalStateException("Giữ chỗ này không gắn với booking nào.");
        }

        try {
            Booking booking = bookingRepository.findById(deposit.getBookingId())
                    .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy booking với id: " + deposit.getBookingId()));

            BigDecimal total = booking.getTotalAmount() != null ? booking.getTotalAmount() : BigDecimal.ZERO;
            BigDecimal percentage = deposit.getDepositPercentage() != null ? deposit.getDepositPercentage() : BigDecimal.valueOf(25);
            BigDecimal depositAmount = total
                    .multiply(percentage)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

            booking.setDeposit(depositAmount);
            booking.setPaidAmount(depositAmount);
            booking.setRemainingAmount(total.subtract(depositAmount).max(BigDecimal.ZERO));
            booking.setIsTemporary(false);
            bookingRepository.save(booking);

            deposit.setStatus("PAID");
            deposit.setDepositPaid(true);
            deposit.setDepositPaidAt(LocalDateTime.now());
            deposit.setDepositAmount(depositAmount);
            deposit.setBookingCode(booking.getBookingCode());
            bookingDepositRepository.save(deposit);

            return new CreateBookingResponse(booking.getBookingCode());
        } catch (Exception e) {
            throw new IllegalStateException("Không thể tạo booking từ giữ chỗ: " + e.getMessage(), e);
        }
    }

    private void validateServicesActive(CreateBookingRequest request) {
        for (int petIdx = 0; petIdx < request.pets().size(); petIdx++) {
            CreateBookingPetRequest petRequest = request.pets().get(petIdx);
            if (petRequest.services() == null) continue;
            for (int svcIdx = 0; svcIdx < petRequest.services().size(); svcIdx++) {
                CreateBookingPetServiceRequest sr = petRequest.services().get(svcIdx);
                fpt.teddypet.domain.entity.Service svc = serviceRepositoryPort.findById(sr.serviceId())
                        .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy dịch vụ: " + sr.serviceId()));
                if (!svc.isActive()) {
                    throw new BookingValidationException(
                            BookingValidationException.SERVICE_INACTIVE,
                            "Dịch vụ \"" + (svc.getServiceName() != null ? svc.getServiceName() : "N/A") + "\" không còn hoạt động. Vui lòng chọn dịch vụ khác.",
                            petIdx, svcIdx, svcIdx > 0, null);
                }
                for (Long addonId : sr.addonServiceIds()) {
                    if (addonId == null) continue;
                    fpt.teddypet.domain.entity.Service addon = serviceRepositoryPort.findById(addonId).orElse(null);
                    if (addon != null && !addon.isActive()) {
                        throw new BookingValidationException(
                                BookingValidationException.SERVICE_INACTIVE,
                                "Dịch vụ add-on \"" + (addon.getServiceName() != null ? addon.getServiceName() : "N/A") + "\" không còn hoạt động. Vui lòng bỏ chọn hoặc chọn add-on khác.",
                                petIdx, svcIdx, svcIdx > 0, null);
                    }
                }
            }
        }
    }

    /**
     * Reserve rooms/time slots for HOLD_MINUTES.
     * - isRequiredRoom=true: mark room status OCCUPIED (and validate not overlapping dates).
     * - isRequiredRoom=false: increment currentBookings of time_slots (validate capacity & optimistic lock).
     */
    private ObjectNode reserveResources(CreateBookingRequest request) {
        ObjectNode payload = objectMapper.createObjectNode();
        ArrayNode rooms = objectMapper.createArrayNode();
        ArrayNode timeSlots = objectMapper.createArrayNode();
        payload.set("rooms", rooms);
        payload.set("timeSlots", timeSlots);

        for (int petIdx = 0; petIdx < request.pets().size(); petIdx++) {
            CreateBookingPetRequest petRequest = request.pets().get(petIdx);
            if (petRequest.services() == null) continue;
            for (int svcIdx = 0; svcIdx < petRequest.services().size(); svcIdx++) {
                CreateBookingPetServiceRequest sr = petRequest.services().get(svcIdx);
                // Hold room
                if (sr.roomId() != null && sr.checkInDate() != null && !sr.checkInDate().isBlank()
                        && sr.checkOutDate() != null && !sr.checkOutDate().isBlank()) {
                    LocalDate checkIn = LocalDate.parse(sr.checkInDate());
                    LocalDate checkOut = LocalDate.parse(sr.checkOutDate());
                    if (bookingPetServiceRepository.existsByRoomIdAndOverlappingDates(sr.roomId(), checkIn, checkOut)) {
                        throw new BookingValidationException(
                                BookingValidationException.ROOM_ALREADY_BOOKED,
                                "Phòng này đã được đặt trong khoảng ngày bạn chọn. Vui lòng chọn phòng khác hoặc đổi ngày.",
                                petIdx, svcIdx, svcIdx > 0, sr.roomId());
                    }
                    Room room = roomRepositoryPort.findById(sr.roomId())
                            .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy phòng với id: " + sr.roomId()));
                    if (room.getStatus() != RoomStatusEnum.AVAILABLE) {
                        throw new BookingValidationException(
                                BookingValidationException.ROOM_ALREADY_BOOKED,
                                "Phòng này vừa được giữ/đặt bởi khách khác. Vui lòng chọn phòng khác.",
                                petIdx, svcIdx, svcIdx > 0, sr.roomId());
                    }
                    room.setStatus(RoomStatusEnum.OCCUPIED);
                    roomRepositoryPort.save(room);
                    rooms.add(sr.roomId());
                    continue;
                }

                // Hold time slot
                if (sr.timeSlotId() != null) {
                    try {
                        TimeSlot slot = timeSlotRepositoryPort.findById(sr.timeSlotId())
                                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy khung giờ: " + sr.timeSlotId()));
                        int maxCap = slot.getMaxCapacity() != null ? slot.getMaxCapacity() : 1;
                        int current = slot.getCurrentBookings() != null ? slot.getCurrentBookings() : 0;
                        if (current >= maxCap) {
                            throw new BookingValidationException(
                                    BookingValidationException.TIME_SLOT_FULL,
                                    "Khung giờ đã đủ chỗ. Vui lòng chọn khung giờ khác cho thú cưng này.",
                                    petIdx, svcIdx, svcIdx > 0, null);
                        }
                        slot.setCurrentBookings(current + 1);
                        timeSlotRepositoryPort.save(slot);
                        timeSlots.add(sr.timeSlotId());
                    } catch (OptimisticLockException e) {
                        throw new BookingValidationException(
                                BookingValidationException.TIME_SLOT_FULL,
                                "Khung giờ vừa được đặt bởi khách khác. Vui lòng làm mới trang và chọn khung giờ khác.",
                                petIdx, svcIdx, svcIdx > 0, null);
                    }
                }
            }
        }
        return payload;
    }
}

