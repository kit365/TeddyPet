package fpt.teddypet.application.dto.request.staff;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

/**
 * DTO tạo ca trống (Open Shift) bởi Admin.
 * Giờ bắt đầu/kết thúc được parse theo múi giờ Việt Nam (Asia/Ho_Chi_Minh).
 */
@JsonDeserialize(using = OpenShiftRequestDeserializer.class)
public record OpenShiftRequest(
        @NotNull
        LocalDateTime startTime,

        @NotNull
        LocalDateTime endTime
) {
}
