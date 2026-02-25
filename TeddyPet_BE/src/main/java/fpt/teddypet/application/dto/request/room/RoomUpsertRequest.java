package fpt.teddypet.application.dto.request.room;

import fpt.teddypet.domain.enums.RoomStatusEnum;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record RoomUpsertRequest(
        Long roomId,
        @NotNull(message = "Loại phòng là bắt buộc")
        Long roomTypeId,
        @Size(max = 255)
        String roomName,
        String additionalAmenities,
        String removedAmenities,
        String images,
        Integer capacity,
        String notes,
        BigDecimal area,
        RoomStatusEnum status,
        Boolean isActive
) {
}

