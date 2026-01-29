package fpt.teddypet.application.dto.response.product.product;

import lombok.Builder;

@Builder
public record ProductSuggestionResponse(
        Long productId,
        String name,
        String slug,
        String imageUrl) {
}
