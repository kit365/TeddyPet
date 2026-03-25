package fpt.teddypet.infrastructure.persistence.postgres.repository.services;

import fpt.teddypet.domain.entity.ServicePricing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServicePricingRepository extends JpaRepository<ServicePricing, Long> {

    List<ServicePricing> findByServiceId(Long serviceId);

    @EntityGraph(attributePaths = {"roomType"})
    List<ServicePricing> findByServiceIdAndIsActiveTrueAndIsDeletedFalse(Long serviceId);

    void deleteByService_Id(Long serviceId);
}
