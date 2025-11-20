package fpt.teddypet.application.dto.response.product.image;

public record ProductImageInfo(
        Long imageId,
        String imageUrl,
        String altText,
        Integer displayOrder,
        Long productId,
        boolean isDeleted,
        boolean isActive
) {
}
