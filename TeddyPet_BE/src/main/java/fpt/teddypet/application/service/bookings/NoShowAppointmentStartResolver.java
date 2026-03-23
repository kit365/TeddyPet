package fpt.teddypet.application.service.bookings;

import fpt.teddypet.application.port.output.shop.TimeSlotRepositoryPort;
import fpt.teddypet.domain.entity.BookingPetService;
import fpt.teddypet.domain.entity.Service;
import fpt.teddypet.domain.entity.TimeSlotBooking;
import fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.TimeSlotBookingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Optional;

/**
 * Thời điểm bắt đầu tính no-show (T0):
 * <ul>
 *     <li>{@code isRequiredRoom = true}: ngày gửi + giờ mở cửa shop (theo lịch làm việc).</li>
 *     <li>{@code isRequiredRoom = false}: giờ bắt đầu khung giờ đã chọn (8:00–9:00 → T0 = 8:00 cùng ngày hẹn).</li>
 * </ul>
 */
@Component
@RequiredArgsConstructor
public class NoShowAppointmentStartResolver {

    private final TimeSlotRepositoryPort timeSlotRepositoryPort;
    private final TimeSlotBookingRepository timeSlotBookingRepository;

    /**
     * @param shopOpen giờ mở cửa shop trong ngày {@code estimatedCheckInDate} (đã resolve từ {@link fpt.teddypet.domain.entity.ShopOperationHour})
     */
    public LocalDateTime resolve(BookingPetService bps, Service svc, LocalTime shopOpen) {
        if (bps == null || svc == null) {
            return null;
        }
        LocalDate est = bps.getEstimatedCheckInDate();
        LocalTime open = shopOpen != null ? shopOpen : NoShowCheckInEvaluator.DEFAULT_SHOP_OPEN;

        if (Boolean.TRUE.equals(svc.getIsRequiredRoom())) {
            if (est == null) {
                return null;
            }
            return LocalDateTime.of(est, open);
        }

        // Dịch vụ chọn khung giờ (không yêu cầu phòng)
        if (bps.getScheduledStartTime() != null) {
            return bps.getScheduledStartTime();
        }

        Optional<TimeSlotBooking> tsbOpt = timeSlotBookingRepository.findByBookingPetService_Id(bps.getId());
        if (tsbOpt.isPresent()) {
            TimeSlotBooking tsb = tsbOpt.get();
            if (tsb.getBookingDate() != null && tsb.getStartTime() != null) {
                return LocalDateTime.of(tsb.getBookingDate(), tsb.getStartTime());
            }
        }

        if (bps.getTimeSlotId() != null && est != null) {
            return timeSlotRepositoryPort
                    .findById(bps.getTimeSlotId())
                    .map(ts -> LocalDateTime.of(est, ts.getStartTime()))
                    .orElse(null);
        }

        if (est != null) {
            return LocalDateTime.of(est, open);
        }
        return null;
    }
}
