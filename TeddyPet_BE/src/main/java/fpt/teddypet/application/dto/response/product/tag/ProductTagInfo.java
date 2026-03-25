package fpt.teddypet.application.dto.response.product.tag;

public record ProductTagInfo(
                Long id,
                String name,
                String slug,
                String color,
                boolean isDeleted,
                boolean isActive) {
}
