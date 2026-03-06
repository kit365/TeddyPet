package fpt.teddypet.domain.exception;

/**
 * Nhân viên toàn thời gian không tự đăng ký ca – ca được gán theo lịch cố định.
 */
public class FullTimeCannotRegisterException extends IllegalStateException {

    public FullTimeCannotRegisterException() {
        super("Nhân viên toàn thời gian không tự đăng ký ca. Ca làm được gán theo lịch cố định. Nếu cần nghỉ, vui lòng dùng Xin nghỉ.");
    }
}
