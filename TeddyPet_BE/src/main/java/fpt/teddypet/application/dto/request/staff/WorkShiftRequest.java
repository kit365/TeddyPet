package fpt.teddypet.application.dto.request.staff;

import fpt.teddypet.domain.enums.staff.WorkShiftStatusEnum;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

public record WorkShiftRequest(
        @NotNull
        Long staffId,

        @NotNull
        LocalDate date,

        @NotNull
        LocalTime regStartTime,

        @NotNull
        LocalTime regEndTime,

        WorkShiftStatusEnum status
) {
}

