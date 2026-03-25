package fpt.teddypet.application.port.output.promotions;

import fpt.teddypet.domain.entity.promotions.Promotion;

import java.util.List;
import java.util.UUID;

public interface PromotionRepositoryPort {
    Promotion save(Promotion promotion);
    Promotion findById(UUID promotionId);
    Promotion findByCode(String code);
    Promotion findByIdAndActiveAndDeleted(UUID promotionId, boolean isActive, boolean isDeleted);
    List<Promotion> findAll();
    List<Promotion> findAllActive();
    boolean existsByCode(String code);
    boolean existsByCodeAndIdNot(String code, UUID promotionId);
    Promotion getReferenceById(UUID promotionId);
}
