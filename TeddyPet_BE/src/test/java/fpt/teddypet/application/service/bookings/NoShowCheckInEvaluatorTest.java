package fpt.teddypet.application.service.bookings;

import fpt.teddypet.domain.entity.NoShowConfig;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
class NoShowCheckInEvaluatorTest {

    private static NoShowConfig cfg(boolean allowLate, int late, int grace, BigDecimal penalty) {
        return NoShowConfig.builder()
                .name("Test")
                .gracePeriodMinutes(grace)
                .autoMarkNoShow(true)
                .penaltyAmount(penalty)
                .allowLateCheckin(allowLate)
                .lateCheckinMinutes(late)
                .build();
    }

    @Test
    void withinLateWindow_noPenalty() {
        LocalDate d = LocalDate.of(2026, 3, 24);
        LocalDateTime t0 = LocalDateTime.of(d, LocalTime.of(8, 0));
        NoShowConfig c = cfg(true, 15, 30, new BigDecimal("50000"));
        LocalDateTime checkIn = t0.plusMinutes(10);
        var r = NoShowCheckInEvaluator.evaluateLine(checkIn, t0, c, 1L, "SVC", "Spa");
        assertEquals(NoShowCheckInEvaluator.Outcome.ON_TIME_OR_LATE_OK, r.outcome());
        assertEquals(BigDecimal.ZERO, r.penaltyApplied());
    }

    @Test
    void pastGrace_noShowPenalty() {
        LocalDate d = LocalDate.of(2026, 3, 24);
        LocalDateTime t0 = LocalDateTime.of(d, LocalTime.of(8, 0));
        NoShowConfig c = cfg(true, 15, 30, new BigDecimal("50000"));
        LocalDateTime checkIn = t0.plusMinutes(45);
        var r = NoShowCheckInEvaluator.evaluateLine(checkIn, t0, c, 1L, "SVC", "Spa");
        assertEquals(NoShowCheckInEvaluator.Outcome.NO_SHOW, r.outcome());
        assertEquals(new BigDecimal("50000"), r.penaltyApplied());
    }

    @Test
    void noShow_zeroPenalty_auditOnly() {
        LocalDate d = LocalDate.of(2026, 3, 24);
        LocalDateTime t0 = LocalDateTime.of(d, LocalTime.of(8, 0));
        NoShowConfig c = cfg(true, 15, 30, BigDecimal.ZERO);
        LocalDateTime checkIn = t0.plusMinutes(45);
        var r = NoShowCheckInEvaluator.evaluateLine(checkIn, t0, c, 1L, "SVC", "Spa");
        assertEquals(NoShowCheckInEvaluator.Outcome.NO_SHOW, r.outcome());
        assertEquals(BigDecimal.ZERO, r.penaltyApplied());
    }

    @Test
    void lateBetweenLateAndGrace_auditOnly() {
        LocalDate d = LocalDate.of(2026, 3, 24);
        LocalDateTime t0 = LocalDateTime.of(d, LocalTime.of(8, 0));
        NoShowConfig c = cfg(true, 15, 45, new BigDecimal("10000"));
        LocalDateTime checkIn = t0.plusMinutes(20);
        var r = NoShowCheckInEvaluator.evaluateLine(checkIn, t0, c, 1L, "SVC", "Spa");
        assertEquals(NoShowCheckInEvaluator.Outcome.LATE_BEFORE_NO_SHOW, r.outcome());
        assertEquals(BigDecimal.ZERO, r.penaltyApplied());
    }
}
