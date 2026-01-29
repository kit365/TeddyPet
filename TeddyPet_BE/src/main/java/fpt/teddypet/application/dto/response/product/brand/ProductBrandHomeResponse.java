package fpt.teddypet.application.dto.response.product.brand;

public record ProductBrandHomeResponse(
        Long id,
        String name,
        String slug,
        Long productCount) {
}
