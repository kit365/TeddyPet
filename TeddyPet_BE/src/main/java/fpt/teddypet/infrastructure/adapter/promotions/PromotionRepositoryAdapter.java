package fpt.teddypet.infrastructure.adapter.promotions;

import fpt.teddypet.application.constants.promotions.PromotionMessages;
import fpt.teddypet.application.port.output.promotions.PromotionRepositoryPort;
import fpt.teddypet.domain.entity.promotions.Promotion;
import fpt.teddypet.infrastructure.persistence.postgres.repository.promotions.PromotionRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class PromotionRepositoryAdapter implements PromotionRepositoryPort {

    private final PromotionRepository promotionRepository;

    @Override
    public Promotion save(Promotion promotion) {
        return promotionRepository.save(promotion);
    }

    @Override
    public Promotion findById(UUID promotionId) {
        return promotionRepository.findById(promotionId)
                .orElseThrow(() -> new EntityNotFoundException(
                        String.format(PromotionMessages.MESSAGE_PROMOTION_NOT_FOUND_BY_ID, promotionId)));
    }

    @Override
    public Promotion findByCode(String code) {
        return promotionRepository.findByCode(code)
                .orElseThrow(() -> new EntityNotFoundException(
                        String.format(PromotionMessages.MESSAGE_PROMOTION_NOT_FOUND_BY_CODE, code)));
    }

    @Override
    public Promotion findByIdAndActiveAndDeleted(UUID promotionId, boolean isActive, boolean isDeleted) {
        if (promotionId == null) {
            return null;
        }
        return promotionRepository.findByIdAndIsActiveAndIsDeleted(promotionId, isActive, isDeleted)
                .orElseThrow(() -> new EntityNotFoundException(
                        String.format(PromotionMessages.MESSAGE_PROMOTION_NOT_FOUND_BY_ID, promotionId)));
    }

    @Override
    public List<Promotion> findAll() {
        return promotionRepository.findAll();
    }

    @Override
    public List<Promotion> findAllActive() {
        return promotionRepository.findAllByIsActiveAndIsDeleted(true, false);
    }

    @Override
    public boolean existsByCode(String code) {
        return promotionRepository.existsByCode(code);
    }

    @Override
    public boolean existsByCodeAndIdNot(String code, UUID promotionId) {
        return promotionRepository.findByCode(code)
                .filter(p -> !p.getId().equals(promotionId))
                .isPresent();
    }

    @Override
    public Promotion getReferenceById(UUID promotionId) {
        return promotionRepository.getReferenceById(promotionId);
    }
}
