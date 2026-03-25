package fpt.teddypet.infrastructure.persistence.postgres.repository.services;

import fpt.teddypet.domain.entity.ServiceComboService;
import fpt.teddypet.domain.entity.ServiceComboServiceId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServiceComboServiceRepository extends JpaRepository<ServiceComboService, ServiceComboServiceId> {

    List<ServiceComboService> findById_ServiceComboId(Long serviceComboId);

    void deleteById_ServiceComboId(Long serviceComboId);
}
