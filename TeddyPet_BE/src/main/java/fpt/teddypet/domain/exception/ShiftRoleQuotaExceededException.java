package fpt.teddypet.domain.exception;

/**
 * Đăng ký vượt quá định mức còn trống cho vai trò này trong ca.
 */
public class ShiftRoleQuotaExceededException extends IllegalStateException {

    public ShiftRoleQuotaExceededException(Long shiftId, String roleName, int maxSlots) {
        super(String.format("Ca làm %d cho vị trí '%s' chỉ còn tối đa %d chỗ. Không thể đăng ký thêm.", shiftId, roleName, maxSlots));
    }
}
