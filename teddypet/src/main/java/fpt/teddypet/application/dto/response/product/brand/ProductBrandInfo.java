package fpt.teddypet.application.dto.response.product.brand;

public record ProductBrandInfo(
        Long id,
        String name,
        boolean isDeleted,
        boolean isActive
) {
}

