package fpt.teddypet.infrastructure.persistence.postgres.repository.bookings;

import fpt.teddypet.domain.entity.BookingDeposit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingDepositRepository extends JpaRepository<BookingDeposit, Long> {

    @Query("SELECT b FROM BookingDeposit b WHERE b.status = :status AND b.expiresAt <= :now")
    List<BookingDeposit> findExpiredByStatus(@Param("status") String status, @Param("now") LocalDateTime now);

    List<BookingDeposit> findByBookingId(Long bookingId);

    @Query("SELECT b FROM BookingDeposit b WHERE b.status = :status AND b.expiresAt <= :threshold AND b.reminderSent = false")
    List<BookingDeposit> findPendingReminders(@Param("status") String status,
            @Param("threshold") LocalDateTime threshold);

    Optional<BookingDeposit> findFirstByPayosOrderCode(Long payosOrderCode);
}
