package fpt.teddypet.infrastructure.persistence.postgres.repository.staff;

import fpt.teddypet.domain.entity.staff.Contract;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface ContractRepository extends JpaRepository<Contract, Long> {

    List<Contract> findByStaffIdOrderByStartDateDesc(@Param("staffId") Long staffId);

    @Query("""
            SELECT c FROM Contract c
            WHERE c.staff.id = :staffId
              AND c.status = 'ACTIVE'
              AND (
                    (c.startDate <= :to AND (c.endDate IS NULL OR c.endDate >= :from))
                  )
            """)
    List<Contract> findActiveContractsForStaffInRange(@Param("staffId") Long staffId,
                                                     @Param("from") LocalDate from,
                                                     @Param("to") LocalDate to);
}

