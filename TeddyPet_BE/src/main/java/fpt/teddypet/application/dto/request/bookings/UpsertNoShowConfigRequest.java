package fpt.teddypet.application.dto.request.bookings;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record UpsertNoShowConfigRequest(
        @NotNull(message = "GRACE_PERIOD_MINUTES là bắt buộc") @Min(value = 0, message = "GRACE_PERIOD_MINUTES không được âm") Integer gracePeriodMinutes,
        @NotNull(message = "AUTO_MARK_NO_SHOW là bắt buộc") Boolean autoMarkNoShow,
        @NotNull(message = "FORFEIT_DEPOSIT là bắt buộc") Boolean forfeitDeposit,
        @NotNull(message = "PENALTY_AMOUNT là bắt buộc") @Min(value = 0, message = "PENALTY_AMOUNT không được âm") BigDecimal penaltyAmount,
        @NotNull(message = "ALLOW_LATE_CHECKIN là bắt buộc") Boolean allowLateCheckin,
        @NotNull(message = "LATE_CHECKIN_MINUTES là bắt buộc") @Min(value = 0, message = "LATE_CHECKIN_MINUTES không được âm") Integer lateCheckinMinutes,
        Boolean isActive) {
}

