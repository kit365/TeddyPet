package fpt.teddypet.application.dto.response.product.brand;

import java.time.LocalDateTime;

public record ProductBrandResponse(
                Long brandId,
                String name,
                String slug,
                String description,
                String logoUrl,
                String altImage,
                String websiteUrl,
                boolean isActive,
                boolean isDeleted,
                LocalDateTime createdAt,
                LocalDateTime updatedAt,
                String createdBy,
                String updatedBy) {
}
