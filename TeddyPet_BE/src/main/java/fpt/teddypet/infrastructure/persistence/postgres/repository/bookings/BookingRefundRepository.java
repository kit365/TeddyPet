package fpt.teddypet.infrastructure.persistence.postgres.repository.bookings;

import fpt.teddypet.domain.entity.BookingRefund;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookingRefundRepository extends JpaRepository<BookingRefund, Long> {
    List<BookingRefund> findByBookingId(Long bookingId);
    List<BookingRefund> findByBookingIdOrderByCreatedAtDesc(Long bookingId);
}
