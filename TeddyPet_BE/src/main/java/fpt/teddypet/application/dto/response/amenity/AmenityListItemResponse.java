package fpt.teddypet.application.dto.response.amenity;

/**
 * For dropdown: id + label (description) + optional category for grouping.
 */
public record AmenityListItemResponse(
        Long id,
        String description,
        String icon,
        Long categoryId,
        String categoryName,
        Integer displayOrder,
        Boolean isActive
) {
}
