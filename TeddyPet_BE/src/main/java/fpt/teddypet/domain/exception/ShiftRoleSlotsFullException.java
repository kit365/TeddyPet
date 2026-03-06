package fpt.teddypet.domain.exception;

/**
 * Ca làm đã đủ định mức cho vai trò này, không thể duyệt thêm.
 */
public class ShiftRoleSlotsFullException extends IllegalStateException {

    public ShiftRoleSlotsFullException(Long shiftId, String roleName, int maxSlots) {
        super(String.format("Ca làm %d cho vị trí '%s' đã đủ định mức (%d người). Không thể duyệt thêm.", shiftId, roleName, maxSlots));
    }
}
