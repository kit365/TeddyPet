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
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class InternalShippingApplicationService implements InternalShippingService {

    private final ShippingRuleRepositoryPort shippingRuleRepositoryPort;

    @Override
    @Transactional
    public ShippingRuleResponse createRule(ShippingRuleRequest request) {
        // Check if rule already exists for this location
        Optional<ShippingRule> existingRuleOpt;
        if (request.districtId() != null) {
            existingRuleOpt = shippingRuleRepositoryPort.findByLocation(request.provinceId(), request.districtId());
        } else {
            existingRuleOpt = shippingRuleRepositoryPort.findByProvince(request.provinceId());
        }

        ShippingRule rule;
        if (existingRuleOpt.isPresent()) {
            // Update existing rule
            rule = existingRuleOpt.get();
            rule.setIsInnerCity(request.isInnerCity() != null ? request.isInnerCity() : rule.getIsInnerCity());
            rule.setFixedFee(request.fixedFee());
            rule.setMaxInternalDistanceKm(request.maxInternalDistanceKm());
            rule.setFeePerKm(request.feePerKm());
            rule.setFreeShipThreshold(request.freeShipThreshold());
            rule.setNote(request.note());
            rule.setMinFee(request.minFee());
            rule.setBaseWeight(request.baseWeight());
            rule.setOverWeightFee(request.overWeightFee());
            rule.setFreeShipDistanceKm(request.freeShipDistanceKm());
            rule.setIsSelfShip(request.isSelfShip() != null ? request.isSelfShip() : true);
        } else {
            // Create new rule
            rule = ShippingRule.builder()
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
                    .freeShipDistanceKm(request.freeShipDistanceKm())
                    .isSelfShip(request.isSelfShip() != null ? request.isSelfShip() : true)
                    .build();
        }

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
        if (request.freeShipDistanceKm() != null)
            rule.setFreeShipDistanceKm(request.freeShipDistanceKm());
        if (request.isSelfShip() != null)
            rule.setIsSelfShip(request.isSelfShip());

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
    public ShippingSuggestionResponse getFeeSuggestion(double distance, Integer provinceId, BigDecimal orderTotal,
            Double weight) {
        Optional<ShippingRule> ruleOpt = Optional.empty();

        if (provinceId != null && provinceId > 0) {
            ruleOpt = shippingRuleRepositoryPort.findByProvince(provinceId);
        }

        if (ruleOpt.isEmpty()) {
            List<ShippingRule> allRules = shippingRuleRepositoryPort.findAll();
            ruleOpt = allRules.stream()
                    .filter(rule -> Boolean.TRUE.equals(rule.getIsInnerCity()))
                    .sorted(Comparator.comparing(ShippingRule::getUpdatedAt,
                            Comparator.nullsLast(Comparator.reverseOrder())))
                    .findFirst();

            if (ruleOpt.isEmpty() && !allRules.isEmpty()) {
                ruleOpt = allRules.stream()
                        .sorted(Comparator.comparing(ShippingRule::getUpdatedAt,
                                Comparator.nullsLast(Comparator.reverseOrder())))
                        .findFirst();
            }
        }

        if (ruleOpt.isEmpty()) {
            return new ShippingSuggestionResponse(BigDecimal.ZERO, "UNKNOWN_RULE", distance, BigDecimal.ZERO,
                    BigDecimal.ZERO, 0.0);
        }

        ShippingRule rule = ruleOpt.get();

        // Distance Check
        if (rule.getMaxInternalDistanceKm() != null && distance > rule.getMaxInternalDistanceKm()) {
            return new ShippingSuggestionResponse(BigDecimal.ZERO, "OUT_OF_RANGE", distance, rule.getFeePerKm(),
                    rule.getOverWeightFee(), rule.getBaseWeight());
        }

        // Free Ship logic
        if ((rule.getFreeShipDistanceKm() != null && rule.getFreeShipDistanceKm() > 0
                && distance < rule.getFreeShipDistanceKm()) ||
                (orderTotal != null && rule.getFreeShipThreshold() != null
                        && rule.getFreeShipThreshold().compareTo(BigDecimal.ZERO) > 0
                        && orderTotal.compareTo(rule.getFreeShipThreshold()) >= 0)) {
            return new ShippingSuggestionResponse(BigDecimal.ZERO, "FREE_SHIP", distance, rule.getFeePerKm(),
                    rule.getOverWeightFee(), rule.getBaseWeight());
        }

        // Calculation
        BigDecimal feePerKm = rule.getFeePerKm() != null ? rule.getFeePerKm() : BigDecimal.ZERO;
        BigDecimal distanceFee = feePerKm.multiply(BigDecimal.valueOf(distance));

        BigDecimal overWeightFee = BigDecimal.ZERO;
        if (weight != null && rule.getBaseWeight() != null && weight > rule.getBaseWeight()
                && rule.getOverWeightFee() != null) {
            double excessWeight = weight - rule.getBaseWeight();
            overWeightFee = rule.getOverWeightFee().multiply(BigDecimal.valueOf(excessWeight));
        }

        BigDecimal totalFee = distanceFee.add(overWeightFee);

        // Apply Min Fee
        if (rule.getMinFee() != null && totalFee.compareTo(rule.getMinFee()) < 0) {
            totalFee = rule.getMinFee();
        }

        return new ShippingSuggestionResponse(totalFee, "IN_RANGE", distance, rule.getFeePerKm(),
                rule.getOverWeightFee(), rule.getBaseWeight());
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
                rule.getOverWeightFee(),
                rule.getFreeShipDistanceKm(),
                rule.getIsSelfShip());
    }
}
