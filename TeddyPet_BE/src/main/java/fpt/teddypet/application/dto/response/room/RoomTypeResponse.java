package fpt.teddypet.application.dto.response.room;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record RoomTypeResponse(
        Long roomTypeId,
        Long serviceId,
        String serviceName,
        String typeName,
        String displayTypeName,
        String slug,
        String description,
        String shortDescription,
        String imageUrl,
        List<String> galleryImages,
        BigDecimal minArea,
        BigDecimal maxArea,
        Integer maxPets,
        BigDecimal minPetWeight,
        BigDecimal maxPetWeight,
        String suitablePetSizes,
        List<String> suitablePetTypes,
        BigDecimal basePricePerNight,
        String standardAmenities,
        String features,
        Integer displayOrder,
        String cancellationPolicy,
        Boolean requiresVaccination,
        Boolean requiresHealthCheck,
        Integer totalRooms,
        String metaTitle,
        String metaDescription,
        String keywords,
        @JsonProperty("isActive")
        boolean isActive,
        boolean isDeleted,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        String createdBy,
        String updatedBy
) {
}
