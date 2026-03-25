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
    REJECTED,
    /** Full-time đã xin nghỉ, chờ admin duyệt – vẫn giữ slot đến khi admin Duyệt nghỉ (ON_LEAVE) hoặc Từ chối (APPROVED) */
    PENDING_LEAVE,
    /** Full-time xin nghỉ được admin duyệt – nhả 1 slot cho Part-time đăng ký bù */
    ON_LEAVE
}
