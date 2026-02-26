package fpt.teddypet.domain.enums.staff;

/**
 * Trạng thái đăng ký ca làm việc của nhân viên.
 */
public enum RegistrationStatus {
    /** Đang chờ admin duyệt */
    PENDING,
    /** Admin đã duyệt - nhân viên được gán ca */
    APPROVED,
    /** Admin từ chối / nhân viên khác được chọn */
    REJECTED
}
