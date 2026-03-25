package fpt.teddypet.infrastructure.persistence.postgres.repository.bookings;

import fpt.teddypet.domain.entity.BookingPaymentTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookingPaymentTransactionRepository extends JpaRepository<BookingPaymentTransaction, Long> {

    List<BookingPaymentTransaction> findByBookingIdOrderByPaidAtAsc(Long bookingId);
}
