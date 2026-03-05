package fpt.teddypet.domain.exception;

/**
 * Ném khi tạo ca trống mà thời gian không nằm trong tuần tiếp theo.
 */
public class ShiftMustBeNextWeekException extends IllegalArgumentException {

    public ShiftMustBeNextWeekException(String message) {
        super(message);
    }
}
