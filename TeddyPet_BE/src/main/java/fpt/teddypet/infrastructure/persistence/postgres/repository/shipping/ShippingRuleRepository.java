package fpt.teddypet.infrastructure.persistence.postgres.repository.shipping;

import fpt.teddypet.domain.entity.ShippingRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ShippingRuleRepository extends JpaRepository<ShippingRule, Long> {
    Optional<ShippingRule> findByProvinceIdAndDistrictId(Integer provinceId, Integer districtId);

    Optional<ShippingRule> findByProvinceIdAndDistrictIdIsNull(Integer provinceId);
}
