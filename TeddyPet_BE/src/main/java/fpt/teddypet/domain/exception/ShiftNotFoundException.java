package fpt.teddypet.domain.exception;

import jakarta.persistence.EntityNotFoundException;

/**
 * Không tìm thấy ca làm việc với id đã cho.
 */
public class ShiftNotFoundException extends EntityNotFoundException {

    public ShiftNotFoundException(Long shiftId) {
        super("Không tìm thấy ca làm việc với id: " + shiftId);
    }
}
