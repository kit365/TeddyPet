package fpt.teddypet.infrastructure.persistence.postgres.repository.bookings;

import fpt.teddypet.domain.entity.BookingPet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookingPetRepository extends JpaRepository<BookingPet, Long> {

    List<BookingPet> findByBooking_Id(Long bookingId);
}

