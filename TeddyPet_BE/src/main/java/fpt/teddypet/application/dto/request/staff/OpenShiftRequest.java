package fpt.teddypet.application.dto.request.staff;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

/**
 * DTO tạo ca trống (Open Shift) bởi Admin.
 */
public record OpenShiftRequest(
        @NotNull
        LocalDateTime startTime,

        @NotNull
        LocalDateTime endTime
) {
}
