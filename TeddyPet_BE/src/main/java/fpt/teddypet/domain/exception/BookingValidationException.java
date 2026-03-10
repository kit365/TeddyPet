package fpt.teddypet.domain.exception;

import lombok.Getter;

/**
 * Lỗi validation khi đặt lịch: dịch vụ không còn hoạt động, khung giờ đã đủ, phòng đã được đặt trước.
 * FE dùng errorCode, petIndex, serviceIndex để scroll tới đúng vị trí form.
 */
@Getter
public class BookingValidationException extends IllegalStateException {

    public static final String SERVICE_INACTIVE = "SERVICE_INACTIVE";
    public static final String TIME_SLOT_FULL = "TIME_SLOT_FULL";
    public static final String ROOM_ALREADY_BOOKED = "ROOM_ALREADY_BOOKED";

    private final String errorCode;
    private final Integer petIndex;
    private final Integer serviceIndex;
    private final Boolean isAdditionalService;
    private final Long roomId;

    public BookingValidationException(String errorCode, String message,
                                       Integer petIndex, Integer serviceIndex,
                                       Boolean isAdditionalService, Long roomId) {
        super(message);
        this.errorCode = errorCode;
        this.petIndex = petIndex;
        this.serviceIndex = serviceIndex;
        this.isAdditionalService = isAdditionalService != null && isAdditionalService;
        this.roomId = roomId;
    }
}
