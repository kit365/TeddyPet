package fpt.teddypet.application.mapper;

import fpt.teddypet.application.dto.request.products.rating.RatingRequest;
import fpt.teddypet.application.dto.response.product.rating.RatingResponse;
import fpt.teddypet.domain.entity.Rating;
import org.mapstruct.*;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface RatingMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "product", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "deleted", ignore = true)
    @Mapping(target = "active", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    void updateRatingFromRequest(RatingRequest request, @MappingTarget Rating rating);

    @Mapping(target = "ratingId", source = "id")
    @Mapping(target = "productId", source = "product.id")
    @Mapping(target = "productName", source = "product.name")
    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "userName", source = "user.username")
    RatingResponse toResponse(Rating rating);
}

