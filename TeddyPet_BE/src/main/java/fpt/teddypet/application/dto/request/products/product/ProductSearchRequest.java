package fpt.teddypet.application.dto.request.products.product;

import fpt.teddypet.application.dto.common.SortDirection;
import fpt.teddypet.domain.enums.PetTypeEnum;
import fpt.teddypet.domain.enums.ProductStatusEnum;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;

import java.time.LocalDateTime;
import java.util.List;

public record ProductSearchRequest(
        @Min(value = 0, message = "Page number must be greater than or equal to 0")
        Integer page,
        
        @Min(value = 1, message = "Page size must be greater than or equal to 1")
        @Max(value = 100, message = "Page size must be less than or equal to 100")
        Integer size,
        
        String keyword,
        
        String sortKey,
        
        String sortDirection,
        
        // A. Bộ lọc Phân tích dữ liệu
        List<Long> categoryIds,          
        Long brandId,                     
        List<PetTypeEnum> petTypes,      
        List<Long> ageRangeIds,        
        
        // B. Bộ lọc Trạng thái & Vận hành
        ProductStatusEnum status,        
        String stockStatus,             
        Integer stockThreshold,           // Threshold cho TỒN_KHO_THẤP (default: 10)
        Boolean includeDeletedVariants,   // Checkbox: Include deleted variants (ProductVariant.isDeleted)
        
        // C. Bộ lọc Kiểm toán & Chất lượng
        LocalDateTime createdAtFrom,    
        LocalDateTime createdAtTo,       
        Boolean missingFeaturedImage,     // Checkbox: Thiếu featuredImage
        Boolean missingDescription        // Checkbox: Thiếu description
) {
    public ProductSearchRequest {
        // Default values
        if (page == null) {
            page = 0;
        }
        if (size == null) {
            size = 20;
        }
        if (stockThreshold == null) {
            stockThreshold = 10; // Default threshold for low stock
        }
        if (includeDeletedVariants == null) {
            includeDeletedVariants = false; // Default: exclude deleted variants
        }
        if (missingFeaturedImage == null) {
            missingFeaturedImage = false;
        }
        if (missingDescription == null) {
            missingDescription = false;
        }
    }

    public ProductSortField getSortField() {
        return ProductSortField.fromFieldName(sortKey);
    }

    public SortDirection getSortDir() {
        return SortDirection.fromString(sortDirection);
    }
    
    public boolean hasCategoryFilter() {
        return categoryIds != null && !categoryIds.isEmpty();
    }
    
    public boolean hasBrandFilter() {
        return brandId != null;
    }
    
    public boolean hasPetTypeFilter() {
        return petTypes != null && !petTypes.isEmpty();
    }
    
    public boolean hasAgeRangeFilter() {
        return ageRangeIds != null && !ageRangeIds.isEmpty();
    }
    
    public boolean hasStatusFilter() {
        return status != null;
    }
    
    public boolean hasStockFilter() {
        return stockStatus != null && !stockStatus.trim().isEmpty();
    }
    
    public boolean hasDateRangeFilter() {
        return createdAtFrom != null || createdAtTo != null;
    }
}

