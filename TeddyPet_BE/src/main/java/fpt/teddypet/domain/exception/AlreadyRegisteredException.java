package fpt.teddypet.domain.exception;

/**
 * Nhân viên đã đăng ký ca làm việc này rồi.
 */
public class AlreadyRegisteredException extends IllegalStateException {

    public AlreadyRegisteredException(Long shiftId, Long staffId) {
        super(String.format("Nhân viên %d đã đăng ký ca làm việc %d rồi.", staffId, shiftId));
    }
}
