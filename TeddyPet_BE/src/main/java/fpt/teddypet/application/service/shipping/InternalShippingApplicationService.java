package fpt.teddypet.application.service.shipping;

import fpt.teddypet.application.constants.shipping.ShippingMessages;
import fpt.teddypet.application.dto.request.shipping.ShippingRuleRequest;
import fpt.teddypet.application.dto.response.shipping.ShippingRuleResponse;
import fpt.teddypet.application.dto.response.shipping.ShippingSuggestionResponse;
import fpt.teddypet.application.port.input.shipping.InternalShippingService;
import fpt.teddypet.application.port.output.shipping.ShippingRuleRepositoryPort;
import fpt.teddypet.domain.entity.ShippingRule;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class InternalShippingApplicationService implements InternalShippingService {

    private final ShippingRuleRepositoryPort shippingRuleRepositoryPort;

    @Override
    @Transactional
    public ShippingRuleResponse createRule(ShippingRuleRequest request) {
        ShippingRule rule = ShippingRule.builder()
                .isInnerCity(request.isInnerCity() != null ? request.isInnerCity() : true)
                .provinceId(request.provinceId())
                .districtId(request.districtId())
                .fixedFee(request.fixedFee())
                .maxInternalDistanceKm(request.maxInternalDistanceKm())
                .feePerKm(request.feePerKm())
                .freeShipThreshold(request.freeShipThreshold())
                .note(request.note())
                .minFee(request.minFee())
                .baseWeight(request.baseWeight())
                .overWeightFee(request.overWeightFee())
                .build();

        ShippingRule savedRule = shippingRuleRepositoryPort.save(rule);
        return toResponse(savedRule);
    }

    @Override
    @Transactional
    public ShippingRuleResponse updateRule(Long id, ShippingRuleRequest request) {
        ShippingRule rule = shippingRuleRepositoryPort.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(ShippingMessages.SHIPPING_RULE_NOT_FOUND));

        if (request.isInnerCity() != null)
            rule.setIsInnerCity(request.isInnerCity());
        if (request.provinceId() != null)
            rule.setProvinceId(request.provinceId());
        rule.setDistrictId(request.districtId()); // District can be null
        if (request.fixedFee() != null)
            rule.setFixedFee(request.fixedFee());
        if (request.maxInternalDistanceKm() != null)
            rule.setMaxInternalDistanceKm(request.maxInternalDistanceKm());
        if (request.feePerKm() != null)
            rule.setFeePerKm(request.feePerKm());
        if (request.freeShipThreshold() != null)
            rule.setFreeShipThreshold(request.freeShipThreshold());
        if (request.note() != null)
            rule.setNote(request.note());
        if (request.minFee() != null)
            rule.setMinFee(request.minFee());
        if (request.baseWeight() != null)
            rule.setBaseWeight(request.baseWeight());
        if (request.overWeightFee() != null)
            rule.setOverWeightFee(request.overWeightFee());

        ShippingRule savedRule = shippingRuleRepositoryPort.save(rule);
        return toResponse(savedRule);
    }

    // ... existing deleteRule code ...
    @Override
    @Transactional
    public void deleteRule(Long id) {
        if (shippingRuleRepositoryPort.findById(id).isEmpty()) {
            throw new EntityNotFoundException(ShippingMessages.SHIPPING_RULE_NOT_FOUND);
        }
        shippingRuleRepositoryPort.deleteById(id);
    }

    @Override
    public List<ShippingRuleResponse> getAllRules() {
        return shippingRuleRepositoryPort.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    // ... existing getFeeSuggestion code ...

    @Override
    public ShippingSuggestionResponse getFeeSuggestion(double distance, Integer provinceId) {
        Optional<ShippingRule> ruleOpt = shippingRuleRepositoryPort.findByProvince(provinceId);

        // If no specific rule found, return status UNKNOWN or default handling
        // For simplicity, if not found, we assume OUT_OF_RANGE or requires manual check
        if (ruleOpt.isEmpty()) {
            // Fallback to general logic or return null/error
            return new ShippingSuggestionResponse(BigDecimal.ZERO, "UNKNOWN_RULE", distance);
        }

        ShippingRule rule = ruleOpt.get();

        if (distance > rule.getMaxInternalDistanceKm()) {
            return new ShippingSuggestionResponse(BigDecimal.ZERO, "OUT_OF_RANGE", distance);
        }

        BigDecimal fee = rule.getFeePerKm().multiply(BigDecimal.valueOf(distance));

        // Apply Min Fee logic
        if (rule.getMinFee() != null && fee.compareTo(rule.getMinFee()) < 0) {
            fee = rule.getMinFee();
        }

        return new ShippingSuggestionResponse(fee, "IN_RANGE", distance);
    }

    // ... existing getEstimatedFeeForUser code ...

    @Override
    public BigDecimal getEstimatedFeeForUser(Integer provinceId, Integer districtId) {
        // 1. Try to find rule by Province + District
        Optional<ShippingRule> districtRule = shippingRuleRepositoryPort.findByLocation(provinceId, districtId);
        if (districtRule.isPresent()) {
            return districtRule.get().getFixedFee();
        }

        // 2. Try to find rule by Province only
        Optional<ShippingRule> provinceRule = shippingRuleRepositoryPort.findByProvince(provinceId);
        if (provinceRule.isPresent()) {
            return provinceRule.get().getFixedFee();
        }

        // 3. Fallback default fee (Could be configured or constant)
        return BigDecimal.valueOf(30000); // Default 30k
    }

    private ShippingRuleResponse toResponse(ShippingRule rule) {
        return new ShippingRuleResponse(
                rule.getId(),
                rule.getIsInnerCity(),
                rule.getProvinceId(),
                rule.getDistrictId(),
                rule.getFixedFee(),
                rule.getMaxInternalDistanceKm(),
                rule.getFeePerKm(),
                rule.getFreeShipThreshold(),
                rule.getNote(),
                rule.getMinFee(),
                rule.getBaseWeight(),
                rule.getOverWeightFee());
    }
}
