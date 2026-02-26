package fpt.teddypet.domain.enums.staff;

/**
 * Trạng thái ca làm việc trong luồng Open Shifts + Shift Bidding.
 */
public enum ShiftStatus {
    /** Ca trống, chưa gán nhân viên - nhân viên có thể đăng ký */
    OPEN,
    /** Đã duyệt và gán nhân viên cho ca */
    ASSIGNED,
    /** Ca đã hoàn thành */
    COMPLETED,
    /** Ca đã hủy */
    CANCELLED
}
