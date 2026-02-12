package fpt.teddypet.infrastructure.adapter.shipping;

import fpt.teddypet.application.port.output.shipping.ShippingRuleRepositoryPort;
import fpt.teddypet.domain.entity.ShippingRule;
import fpt.teddypet.infrastructure.persistence.postgres.repository.shipping.ShippingRuleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class ShippingRuleRepositoryAdapter implements ShippingRuleRepositoryPort {

    private final ShippingRuleRepository repository;

    @Override
    public ShippingRule save(ShippingRule shippingRule) {
        return repository.save(shippingRule);
    }

    @Override
    public Optional<ShippingRule> findById(Long id) {
        return repository.findById(id);
    }

    @Override
    public void deleteById(Long id) {
        repository.deleteById(id);
    }

    @Override
    public List<ShippingRule> findAll() {
        return repository.findAll();
    }

    @Override
    public Optional<ShippingRule> findByLocation(Integer provinceId, Integer districtId) {
        return repository.findByProvinceIdAndDistrictId(provinceId, districtId);
    }

    @Override
    public Optional<ShippingRule> findByProvince(Integer provinceId) {
        return repository.findByProvinceIdAndDistrictIdIsNull(provinceId);
    }
}
