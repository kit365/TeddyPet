package fpt.teddypet.application.service.promotions;

import fpt.teddypet.application.constants.promotions.PromotionLogMessages;
import fpt.teddypet.application.constants.promotions.PromotionMessages;
import fpt.teddypet.application.dto.request.promotions.PromotionRequest;
import fpt.teddypet.application.dto.response.promotions.promotion.PromotionInfo;
import fpt.teddypet.application.dto.response.promotions.promotion.PromotionResponse;
import fpt.teddypet.application.mapper.promotions.PromotionMapper;
import fpt.teddypet.application.port.input.promotions.PromotionService;
import fpt.teddypet.application.port.output.promotions.PromotionRepositoryPort;
import fpt.teddypet.application.util.EntityFilterUtil;
import fpt.teddypet.application.util.ImageAltUtil;
import fpt.teddypet.application.util.ValidationUtils;
import fpt.teddypet.domain.entity.promotions.Promotion;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PromotionApplicationService implements PromotionService {

    private final PromotionRepositoryPort promotionRepositoryPort;
    private final PromotionMapper promotionMapper;

    @Override
    @Transactional
    public void create(PromotionRequest request) {
        log.info(PromotionLogMessages.LOG_PROMOTION_CREATE_START, request.code());

        // Validate code uniqueness
        validateCodeUniqueness(request.code(), null);

        // Validate date range
        validateDateRange(request.startDate(), request.endDate());

        Promotion promotion = Promotion.builder().build();
        promotionMapper.updatePromotionFromRequest(request, promotion);
        promotion.setAltImage(ImageAltUtil.generateAltText(request.name()));
        promotion.setActive(true);
        promotion.setDeleted(false);
        promotion.setUsageCount(0);

        Promotion savedPromotion = promotionRepositoryPort.save(promotion);
        log.info(PromotionLogMessages.LOG_PROMOTION_CREATE_SUCCESS, savedPromotion.getId());
    }

    @Override
    @Transactional
    public void update(UUID promotionId, PromotionRequest request) {
        log.info(PromotionLogMessages.LOG_PROMOTION_UPDATE_START, promotionId);
        Promotion promotion = getById(promotionId);

        // Validate code uniqueness (skip if same code)
        if (!promotion.getCode().equals(request.code())) {
            validateCodeUniqueness(request.code(), promotionId);
        }

        // Validate date range
        validateDateRange(request.startDate(), request.endDate());

        promotionMapper.updatePromotionFromRequest(request, promotion);
        promotion.setAltImage(ImageAltUtil.generateAltText(request.name()));

        Promotion savedPromotion = promotionRepositoryPort.save(promotion);
        log.info(PromotionLogMessages.LOG_PROMOTION_UPDATE_SUCCESS, savedPromotion.getId());
    }

    @Override
    @Transactional
    public void save(Promotion promotion) {
        promotionRepositoryPort.save(promotion);
    }

    @Override
    public PromotionResponse getByIdResponse(UUID promotionId) {
        log.info(PromotionLogMessages.LOG_PROMOTION_GET_BY_ID, promotionId);
        Promotion promotion = getById(promotionId);
        return promotionMapper.toResponse(promotion);
    }

    @Override
    public PromotionResponse getByCodeResponse(String code) {
        log.info(PromotionLogMessages.LOG_PROMOTION_GET_BY_CODE, code);
        Promotion promotion = getByCode(code);
        return promotionMapper.toResponse(promotion);
    }

    @Override
    public Promotion getById(UUID promotionId) {
        return promotionRepositoryPort.findById(promotionId);
    }

    @Override
    public Promotion getByCode(String code) {
        return promotionRepositoryPort.findByCode(code);
    }

    @Override
    public Promotion getByIdAndStatusAndDeleted(UUID promotionId, boolean isActive, boolean isDeleted) {
        return promotionRepositoryPort.findByIdAndActiveAndDeleted(promotionId, isActive, isDeleted);
    }

    @Override
    public Promotion getReferenceById(UUID promotionId) {
        return promotionRepositoryPort.getReferenceById(promotionId);
    }

    @Override
    public List<PromotionResponse> getAll() {
        List<Promotion> promotions = promotionRepositoryPort.findAll();
        log.info(PromotionLogMessages.LOG_PROMOTION_GET_ALL, promotions.size());
        return promotions.stream()
                .map(promotionMapper::toResponse)
                .toList();
    }

    @Override
    public List<PromotionResponse> getAllActive() {
        List<Promotion> promotions = promotionRepositoryPort.findAllActive();
        log.info(PromotionLogMessages.LOG_PROMOTION_GET_ALL_ACTIVE, promotions.size());
        return promotions.stream()
                .map(promotionMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public void delete(UUID promotionId) {
        log.info(PromotionLogMessages.LOG_PROMOTION_DELETE_START, promotionId);
        Promotion promotion = getById(promotionId);
        promotion.setDeleted(true);
        promotion.setActive(false);
        promotionRepositoryPort.save(promotion);
        log.info(PromotionLogMessages.LOG_PROMOTION_DELETE_SUCCESS, promotionId);
    }

    @Override
    @Transactional
    public void activate(UUID promotionId) {
        log.info(PromotionLogMessages.LOG_PROMOTION_ACTIVATE_START, promotionId);
        Promotion promotion = getById(promotionId);
        promotion.setActive(true);
        promotionRepositoryPort.save(promotion);
        log.info(PromotionLogMessages.LOG_PROMOTION_ACTIVATE_SUCCESS, promotionId);
    }

    @Override
    @Transactional
    public void deactivate(UUID promotionId) {
        log.info(PromotionLogMessages.LOG_PROMOTION_DEACTIVATE_START, promotionId);
        Promotion promotion = getById(promotionId);
        promotion.setActive(false);
        promotionRepositoryPort.save(promotion);
        log.info(PromotionLogMessages.LOG_PROMOTION_DEACTIVATE_SUCCESS, promotionId);
    }

    @Override
    public PromotionInfo toInfo(Promotion promotion) {
        return toInfo(promotion, false, true);
    }

    @Override
    public PromotionInfo toInfo(Promotion promotion, boolean includeDeleted) {
        return toInfo(promotion, includeDeleted, false);
    }

    @Override
    public PromotionInfo toInfo(Promotion promotion, boolean includeDeleted, boolean onlyActive) {
        return EntityFilterUtil.filterAndMap(
                promotion,
                includeDeleted,
                onlyActive,
                Promotion::isDeleted,
                Promotion::isActive,
                promotionMapper::toInfo);
    }

    private void validateCodeUniqueness(String code, UUID promotionId) {
        boolean codeExists = promotionId != null
                ? promotionRepositoryPort.existsByCodeAndIdNot(code, promotionId)
                : promotionRepositoryPort.existsByCode(code);

        if (codeExists) {
            log.warn(PromotionLogMessages.LOG_PROMOTION_CODE_VALIDATION_FAILED, code);
        }

        ValidationUtils.ensureUnique(
                () -> promotionId != null
                        ? promotionRepositoryPort.existsByCodeAndIdNot(code, promotionId)
                        : promotionRepositoryPort.existsByCode(code),
                PromotionMessages.MESSAGE_PROMOTION_CODE_ALREADY_EXISTS);
    }

    private void validateDateRange(java.time.LocalDateTime startDate, java.time.LocalDateTime endDate) {
        if (startDate != null && endDate != null && endDate.isBefore(startDate)) {
            log.warn(PromotionLogMessages.LOG_PROMOTION_DATE_VALIDATION_FAILED,
                    "Start: " + startDate + ", End: " + endDate);
            throw new IllegalArgumentException(PromotionMessages.MESSAGE_PROMOTION_INVALID_DATE_RANGE);
        }
    }
}
