package fpt.teddypet.application.port.output.staff;

import fpt.teddypet.domain.entity.staff.StaffPosition;

import java.util.List;
import java.util.Optional;

public interface StaffPositionRepositoryPort {

    StaffPosition save(StaffPosition position);

    Optional<StaffPosition> findById(Long id);

    Optional<StaffPosition> findByCode(String code);

    boolean existsByCode(String code);

    List<StaffPosition> findAllActive();
}
