package fpt.teddypet.application.dto.request.bookings;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

public record UpsertNoShowConfigRequest(
        @NotBlank(message = "Tên cấu hình là bắt buộc") @Size(max = 255, message = "Tên cấu hình tối đa 255 ký tự") String name,
        @NotNull(message = "GRACE_PERIOD_MINUTES là bắt buộc") @Min(value = 0, message = "GRACE_PERIOD_MINUTES không được âm") Integer gracePeriodMinutes,
        @NotNull(message = "AUTO_MARK_NO_SHOW là bắt buộc") Boolean autoMarkNoShow,
        @NotNull(message = "PENALTY_AMOUNT là bắt buộc") @Min(value = 0, message = "PENALTY_AMOUNT không được âm") BigDecimal penaltyAmount,
        @NotNull(message = "ALLOW_LATE_CHECKIN là bắt buộc") Boolean allowLateCheckin,
        @NotNull(message = "LATE_CHECKIN_MINUTES là bắt buộc") @Min(value = 0, message = "LATE_CHECKIN_MINUTES không được âm") Integer lateCheckinMinutes,
        Boolean isActive,
        /**
         * Khi tạo mới: có thể gửi kèm để gán dịch vụ ngay.
         * Khi cập nhật: {@code null} = giữ nguyên danh sách dịch vụ; danh sách rỗng = xóa hết.
         */
        List<Long> serviceIds) {
}
