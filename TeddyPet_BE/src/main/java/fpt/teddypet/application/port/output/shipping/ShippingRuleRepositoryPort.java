package fpt.teddypet.application.port.output.shipping;

import fpt.teddypet.domain.entity.ShippingRule;
import java.util.List;
import java.util.Optional;

public interface ShippingRuleRepositoryPort {
    ShippingRule save(ShippingRule shippingRule);

    Optional<ShippingRule> findById(Long id);

    void deleteById(Long id);

    List<ShippingRule> findAll();

    Optional<ShippingRule> findByLocation(Integer provinceId, Integer districtId);

    Optional<ShippingRule> findByProvince(Integer provinceId);
}
