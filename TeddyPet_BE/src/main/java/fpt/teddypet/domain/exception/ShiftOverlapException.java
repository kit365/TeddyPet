package fpt.teddypet.domain.exception;

/**
 * Ném khi tạo hoặc cập nhật ca mà khoảng giờ trùng với ca đã có.
 */
public class ShiftOverlapException extends IllegalArgumentException {

    public ShiftOverlapException(String message) {
        super(message);
    }
}
