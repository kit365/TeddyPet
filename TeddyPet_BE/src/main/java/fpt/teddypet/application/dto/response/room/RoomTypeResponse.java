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
        String updatedBy,
        /** Các dịch vụ dùng chung loại phòng (bảng service_room_types). */
        List<Long> linkedServiceIds,
        List<String> linkedServiceNames
) {
    /**
     * Gắn service từ bảng trung gian service_room_types (MapStruct không set các field này).
     * Một loại phòng có thể gắn nhiều dịch vụ.
     */
    public RoomTypeResponse withLinkedServices(List<Long> linkedServiceIds, List<String> linkedServiceNames) {
        Long sid = (linkedServiceIds == null || linkedServiceIds.isEmpty()) ? null : linkedServiceIds.get(0);
        String sname = (linkedServiceNames == null || linkedServiceNames.isEmpty())
                ? null
                : String.join(", ", linkedServiceNames);
        return new RoomTypeResponse(
                roomTypeId(),
                sid,
                sname,
                typeName(),
                displayTypeName(),
                slug(),
                description(),
                shortDescription(),
                imageUrl(),
                galleryImages(),
                minArea(),
                maxArea(),
                maxPets(),
                minPetWeight(),
                maxPetWeight(),
                suitablePetSizes(),
                suitablePetTypes(),
                basePricePerNight(),
                standardAmenities(),
                features(),
                displayOrder(),
                cancellationPolicy(),
                requiresVaccination(),
                requiresHealthCheck(),
                totalRooms(),
                metaTitle(),
                metaDescription(),
                keywords(),
                isActive(),
                isDeleted(),
                createdAt(),
                updatedAt(),
                createdBy(),
                updatedBy(),
                linkedServiceIds != null ? linkedServiceIds : List.of(),
                linkedServiceNames != null ? linkedServiceNames : List.of()
        );
    }
}
