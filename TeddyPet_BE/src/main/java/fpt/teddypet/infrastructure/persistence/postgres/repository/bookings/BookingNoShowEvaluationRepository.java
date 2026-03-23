package fpt.teddypet.infrastructure.persistence.postgres.repository.bookings;

import fpt.teddypet.domain.entity.BookingNoShowEvaluation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BookingNoShowEvaluationRepository extends JpaRepository<BookingNoShowEvaluation, Long> {

    boolean existsByBookingIdAndIsDeletedFalse(Long bookingId);

    Optional<BookingNoShowEvaluation> findByBookingIdAndIsDeletedFalse(Long bookingId);
}
