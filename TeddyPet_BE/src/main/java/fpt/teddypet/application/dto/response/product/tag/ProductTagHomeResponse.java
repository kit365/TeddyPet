package fpt.teddypet.application.dto.response.product.tag;

import lombok.Builder;

@Builder
public record ProductTagHomeResponse(
        Long id,
        String name,
        String slug,
        Long productCount) {
}
