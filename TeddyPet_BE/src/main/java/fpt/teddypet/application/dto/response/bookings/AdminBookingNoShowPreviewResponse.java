package fpt.teddypet.application.dto.response.bookings;

import java.io.Serializable;
import java.util.List;

public record AdminBookingNoShowPreviewResponse(
        /** Đơn đủ điều kiện (chưa check-in, chưa hủy, v.v.) */
        boolean eligibleForNoShowActions,
        /**
         * Hiển thị nút "Đánh No-show" + thông tin trễ: có ít nhất một dịch vụ dùng cấu hình no-show
         * với {@code autoMarkNoShow = false}.
         */
        boolean showManualNoShowButton,
        List<AdminNoShowLinePreview> lines,
        /**
         * Thời điểm hẹn sớm nhất (min của mọi T0 dòng) — khi có nhiều dịch vụ/khung giờ, dùng làm mốc
         * tham chiếu chung cho no-show (ISO-8601 offset +07:00). Null nếu không có dòng.
         */
        String earliestNoShowReferenceStartOffset
) implements Serializable {}
