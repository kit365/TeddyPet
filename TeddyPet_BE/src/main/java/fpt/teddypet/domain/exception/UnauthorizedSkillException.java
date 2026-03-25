package fpt.teddypet.domain.exception;

/**
 * Nhân viên không có kỹ năng phù hợp để đăng ký ca làm việc này.
 */
public class UnauthorizedSkillException extends IllegalStateException {

    public UnauthorizedSkillException() {
        super("Bạn không có chuyên môn/kỹ năng phù hợp để đăng ký vị trí này.");
    }

    public UnauthorizedSkillException(String message) {
        super(message);
    }
}
