package fpt.teddypet.application.mapper.promotions;

import fpt.teddypet.application.dto.response.promotions.promotion_usage.PromotionUsageInfo;
import fpt.teddypet.application.dto.response.promotions.promotion_usage.PromotionUsageResponse;
import fpt.teddypet.domain.entity.promotions.PromotionUsage;
import org.mapstruct.*;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface PromotionUsageMapper {

    @Mapping(source = "user.id", target = "userId")
    @Mapping(source = "user.username", target = "username")
    @Mapping(source = "promotion.id", target = "promotionId")
    @Mapping(source = "promotion.code", target = "promotionCode")
    PromotionUsageResponse toResponse(PromotionUsage promotionUsage);

    @Mapping(source = "user.id", target = "userId")
    @Mapping(source = "promotion.id", target = "promotionId")
    @Mapping(source = "deleted", target = "isDeleted")
    @Mapping(source = "active", target = "isActive")
    PromotionUsageInfo toInfo(PromotionUsage promotionUsage);
}
