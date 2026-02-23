package fpt.teddypet.application.dto.response.room;

import com.fasterxml.jackson.annotation.JsonProperty;
import fpt.teddypet.domain.enums.RoomStatusEnum;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record RoomResponse(
        Long roomId,
        Long roomTypeId,
        String roomTypeName,
        String roomNumber,
        String roomName,
        String building,
        String floor,
        String locationNote,
        BigDecimal customPricePerNight,
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
        @JsonProperty("isAvailableForBooking")
        boolean isAvailableForBooking,
        @JsonProperty("isBlocked")
        boolean isBlocked,
        String blockReason,
        LocalDateTime blockedFrom,
        LocalDateTime blockedTo,
        String blockedBy,
        @JsonProperty("isActive")
        boolean isActive,
        boolean isDeleted,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        String createdBy,
        String updatedBy
) {
}
