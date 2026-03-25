package fpt.teddypet.application.dto.response.room;

import com.fasterxml.jackson.annotation.JsonProperty;
import fpt.teddypet.domain.enums.RoomStatusEnum;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record RoomResponse(
                Long roomId,
                Long roomTypeId,
                String roomTypeName,
                String roomNumber,
                String roomName,
                String tier,
                Integer gridRow,
                Integer gridCol,
                Boolean isSorted,
                Long roomLayoutConfigId,
                String additionalAmenities,
                String removedAmenities,
                String images,
                Integer capacity,
                String notes,
                BigDecimal area,
                RoomStatusEnum status,
                @JsonProperty("isActive") boolean isActive,
                boolean isDeleted,
                LocalDateTime createdAt,
                LocalDateTime updatedAt,
                String createdBy,
                String updatedBy) {
}
