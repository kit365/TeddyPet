package fpt.teddypet.application.mapper.promotions;
import fpt.teddypet.application.dto.request.promotions.PromotionRequest;
import fpt.teddypet.application.dto.response.promotions.promotion.PromotionInfo;
import fpt.teddypet.application.dto.response.promotions.promotion.PromotionResponse;
import fpt.teddypet.domain.entity.promotions.Promotion;
import org.mapstruct.*;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface PromotionMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "usageCount", ignore = true)
    @Mapping(target = "version", ignore = true)
    @Mapping(target = "promotionUsages", ignore = true)
    @Mapping(target = "deleted", ignore = true)
    @Mapping(target = "active", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "altImage", ignore = true)
    void updatePromotionFromRequest(PromotionRequest request, @MappingTarget Promotion promotion);

    PromotionResponse toResponse(Promotion promotion);

    @Mapping(source = "deleted", target = "isDeleted")
    @Mapping(source = "active", target = "isActive")
    PromotionInfo toInfo(Promotion promotion);
}
