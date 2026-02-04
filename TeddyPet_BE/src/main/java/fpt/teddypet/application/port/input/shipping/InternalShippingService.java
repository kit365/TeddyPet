package fpt.teddypet.application.port.input.shipping;

import fpt.teddypet.application.dto.request.shipping.ShippingRuleRequest;
import fpt.teddypet.application.dto.response.shipping.ShippingRuleResponse;
import fpt.teddypet.application.dto.response.shipping.ShippingSuggestionResponse;
import java.math.BigDecimal;
import java.util.List;

public interface InternalShippingService {
    ShippingRuleResponse createRule(ShippingRuleRequest request);

    ShippingRuleResponse updateRule(Long id, ShippingRuleRequest request);

    void deleteRule(Long id);

    List<ShippingRuleResponse> getAllRules();

    ShippingSuggestionResponse getFeeSuggestion(double distance, Integer provinceId);

    BigDecimal getEstimatedFeeForUser(Integer provinceId, Integer districtId);
}
