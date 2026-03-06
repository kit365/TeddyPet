package fpt.teddypet.application.dto.response.staff;

/**
 * Thông tin slot theo vai trò cho một ca: định mức, đã duyệt, còn trống.
 * Part-time chỉ hiển thị nút Đăng ký khi available > 0 (ON_LEAVE được tính là trống).
 */
public record RoleSlotInfoResponse(
        Long positionId,
        String positionName,
        int maxSlots,
        long approvedCount,
        int available
) {
}
