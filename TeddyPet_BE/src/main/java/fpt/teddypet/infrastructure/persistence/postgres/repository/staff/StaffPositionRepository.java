package fpt.teddypet.infrastructure.persistence.postgres.repository.staff;

import fpt.teddypet.domain.entity.staff.StaffPosition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface StaffPositionRepository extends JpaRepository<StaffPosition, Long> {

    Optional<StaffPosition> findByCode(String code);

    boolean existsByCode(String code);

    @Query("SELECT p FROM StaffPosition p WHERE p.isDeleted = false AND p.isActive = true")
    List<StaffPosition> findAllActive();
}
