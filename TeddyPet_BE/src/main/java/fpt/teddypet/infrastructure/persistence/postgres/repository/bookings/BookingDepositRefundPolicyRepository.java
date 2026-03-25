package fpt.teddypet.infrastructure.persistence.postgres.repository.bookings;

import fpt.teddypet.domain.entity.BookingDepositRefundPolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookingDepositRefundPolicyRepository extends JpaRepository<BookingDepositRefundPolicy, Long> {

    @Query("""
            select p from BookingDepositRefundPolicy p
            where p.isDeleted = false
            order by p.displayOrder asc, p.id asc
            """)
    List<BookingDepositRefundPolicy> findAllNotDeletedOrderByDisplayOrder();

    @Query("""
            select p from BookingDepositRefundPolicy p
            where p.isDeleted = false and p.isActive = true and p.isDefault = true
            order by p.displayOrder asc, p.id asc
            """)
    Optional<BookingDepositRefundPolicy> findDefaultActivePolicy();

    @Query("""
            select p from BookingDepositRefundPolicy p
            where p.isDeleted = false and p.isActive = true
            order by p.displayOrder asc, p.id asc
            """)
    List<BookingDepositRefundPolicy> findAllActivePolicies();
}

