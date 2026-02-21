package fpt.teddypet.application.port.output.services;

import fpt.teddypet.domain.entity.ServiceComboService;

import java.util.List;

public interface ServiceComboServiceRepositoryPort {

    ServiceComboService save(ServiceComboService item);

    void saveAll(List<ServiceComboService> items);

    List<ServiceComboService> findByServiceComboId(Long serviceComboId);

    void deleteByServiceComboId(Long serviceComboId);

    void delete(ServiceComboService item);
}
