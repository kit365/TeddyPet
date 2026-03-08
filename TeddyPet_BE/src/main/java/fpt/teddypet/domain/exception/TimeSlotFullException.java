package fpt.teddypet.domain.exception;

/**
 * Khung giờ đã đủ chỗ (currentBookings >= maxCapacity) hoặc xung đột version khi cập nhật.
 * Client nên refetch danh sách khung giờ và chọn slot khác.
 */
public class TimeSlotFullException extends IllegalStateException {

    public TimeSlotFullException() {
        super("Khung giờ đã đủ chỗ. Vui lòng làm mới trang và chọn khung giờ khác.");
    }

    public TimeSlotFullException(String message) {
        super(message);
    }
}
