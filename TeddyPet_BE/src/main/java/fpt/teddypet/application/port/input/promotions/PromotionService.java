package fpt.teddypet.application.port.input.promotions;

import fpt.teddypet.application.dto.request.promotions.PromotionRequest;

import fpt.teddypet.application.dto.response.promotions.promotion.PromotionInfo;
import fpt.teddypet.application.dto.response.promotions.promotion.PromotionResponse;
import fpt.teddypet.domain.entity.promotions.Promotion;

import java.util.List;
import java.util.UUID;

public interface PromotionService {
    void create(PromotionRequest request);

    void update(UUID promotionId, PromotionRequest request);

    void save(Promotion promotion);

    PromotionResponse getByIdResponse(UUID promotionId);

    PromotionResponse getByCodeResponse(String code);

    Promotion getById(UUID promotionId);

    Promotion getByCode(String code);

    Promotion getByIdAndStatusAndDeleted(UUID promotionId, boolean isActive, boolean isDeleted);

    Promotion getReferenceById(UUID promotionId);

    List<PromotionResponse> getAll();

    List<PromotionResponse> getAllActive();

    void delete(UUID promotionId);

    void activate(UUID promotionId);

    void deactivate(UUID promotionId);

    PromotionInfo toInfo(Promotion promotion);

    PromotionInfo toInfo(Promotion promotion, boolean includeDeleted);

    PromotionInfo toInfo(Promotion promotion, boolean includeDeleted, boolean onlyActive);
}
