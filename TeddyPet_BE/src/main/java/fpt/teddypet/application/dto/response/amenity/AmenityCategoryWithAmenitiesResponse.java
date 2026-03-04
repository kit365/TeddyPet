package fpt.teddypet.application.dto.response.amenity;

import java.util.List;

/**
 * Category with its amenities for grouped dropdown.
 */
public record AmenityCategoryWithAmenitiesResponse(
        Long id,
        String categoryName,
        Integer displayOrder,
        List<AmenityListItemResponse> amenities
) {
}
