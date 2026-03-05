package fpt.teddypet.domain.exception;

import fpt.teddypet.domain.enums.staff.ShiftStatus;

/**
 * Ca làm việc không ở trạng thái hợp lệ cho thao tác yêu cầu.
 */
public class InvalidShiftStatusException extends IllegalStateException {

    public InvalidShiftStatusException(Long shiftId, ShiftStatus current, String operation) {
        super(String.format("Ca làm việc %d đang ở trạng thái %s, không thể thực hiện: %s",
                shiftId, current, operation));
    }

    public InvalidShiftStatusException(String message) {
        super(message);
    }
}
