package fpt.teddypet.application.dto.response.product.category;

public record ProductCategoryHomeResponse(
                Long id,
                String name,
                String slug,
                Long productCount) {
}
