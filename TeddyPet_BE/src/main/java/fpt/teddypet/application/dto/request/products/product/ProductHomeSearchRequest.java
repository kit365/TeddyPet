package fpt.teddypet.application.dto.request.products.product;

import lombok.Builder;
import java.util.List;

@Builder
public record ProductHomeSearchRequest(
        String keyword,
        List<String> categorySlugs,
        List<String> brandSlugs,
        List<String> tagSlugs,
        Double minPrice,
        Double maxPrice,
        String sortKey, // e.g., "price", "createdAt", "name"
        String sortDirection, // "asc" or "desc"
        Integer page,
        Integer size) {
    public ProductHomeSearchRequest {
        if (page == null)
            page = 0;
        if (size == null)
            size = 12;
    }
}
