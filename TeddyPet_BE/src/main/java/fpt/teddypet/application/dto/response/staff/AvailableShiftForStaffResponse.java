package fpt.teddypet.application.dto.response.staff;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import fpt.teddypet.domain.enums.staff.ShiftStatus;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Ca trống trả về cho staff: thông tin ca + slot theo từng vai trò (để Part-time biết còn chỗ đăng ký không).
 */
public record AvailableShiftForStaffResponse(
        Long shiftId,
        @JsonSerialize(using = VietnamLocalDateTimeSerializer.class)
        LocalDateTime startTime,
        @JsonSerialize(using = VietnamLocalDateTimeSerializer.class)
        LocalDateTime endTime,
        ShiftStatus status,
        List<RoleSlotInfoResponse> roleSlots
) {
}
