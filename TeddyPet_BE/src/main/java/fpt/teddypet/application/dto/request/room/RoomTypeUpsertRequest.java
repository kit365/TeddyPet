package fpt.teddypet.application.dto.request.room;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

public record RoomTypeUpsertRequest(
        Long roomTypeId,
        Long serviceId,
        @NotBlank(message = "Tên loại phòng là bắt buộc")
        @Size(max = 255)
        String typeName,
        @Size(max = 255)
        String displayTypeName,
        @Size(max = 255)
        String slug,
        String description,
        @Size(max = 500)
        String shortDescription,
        @Size(max = 255)
        String imageUrl,
        List<String> galleryImages,
        BigDecimal minArea,
        BigDecimal maxArea,
        Integer maxPets,
        BigDecimal minPetWeight,
        BigDecimal maxPetWeight,
        @Size(max = 500)
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
        @Size(max = 150)
        String metaTitle,
        @Size(max = 255)
        String metaDescription,
        String keywords,
        Boolean isActive
) {
}
