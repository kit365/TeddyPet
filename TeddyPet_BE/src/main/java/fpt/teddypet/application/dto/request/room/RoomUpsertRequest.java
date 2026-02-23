package fpt.teddypet.application.dto.request.room;

import fpt.teddypet.domain.enums.RoomStatusEnum;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record RoomUpsertRequest(
        Long roomId,
        @NotNull(message = "Loại phòng là bắt buộc")
        Long roomTypeId,
        @NotNull(message = "Mã phòng là bắt buộc")
        @Size(max = 50)
        String roomNumber,
        @Size(max = 255)
        String roomName,
        @Size(max = 100)
        String building,
        @Size(max = 50)
        String floor,
        @Size(max = 500)
        String locationNote,
        BigDecimal customPricePerNight,
        @Size(max = 500)
        String priceNote,
        String additionalAmenities,
        String removedAmenities,
        String images,
        Integer capacity,
        LocalDate expectedCheckoutDate,
        LocalDate currentCheckInDate,
        LocalDateTime lastCleanedAt,
        LocalDateTime lastMaintenanceAt,
        String maintenanceNotes,
        String notes,
        String internalNotes,
        BigDecimal area,
        RoomStatusEnum status,
        Boolean isAvailableForBooking,
        Boolean isBlocked,
        String blockReason,
        LocalDateTime blockedFrom,
        LocalDateTime blockedTo,
        @Size(max = 255)
        String blockedBy,
        Boolean isActive
) {
}
