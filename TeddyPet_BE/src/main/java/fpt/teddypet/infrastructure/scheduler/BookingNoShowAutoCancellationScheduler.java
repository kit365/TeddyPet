package fpt.teddypet.infrastructure.scheduler;

import fpt.teddypet.application.service.bookings.BookingNoShowAutoCancellationService;
import fpt.teddypet.domain.enums.bookings.BookingTypeEnum;
import fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.BookingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Định kỳ kiểm tra đơn chưa check-in, quá grace + cấu hình {@code autoMarkNoShow} → hủy tự động.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class BookingNoShowAutoCancellationScheduler {

    private final BookingRepository bookingRepository;
    private final BookingNoShowAutoCancellationService bookingNoShowAutoCancellationService;

    /** Mỗi 5 phút */
    @Scheduled(fixedDelay = 300_000)
    public void runScheduledNoShowAutoCancel() {
        List<Long> ids = bookingRepository.findIdsEligibleForNoShowAutoCancel(BookingTypeEnum.WALK_IN);
        if (ids.isEmpty()) {
            return;
        }
        log.debug("No-show auto-cancel: checking {} candidate booking(s)", ids.size());
        for (Long id : ids) {
            try {
                bookingNoShowAutoCancellationService.processBookingIfNoShowOverdue(id);
            } catch (Exception e) {
                log.error("No-show auto-cancel failed for booking id {}", id, e);
            }
        }
    }
}
