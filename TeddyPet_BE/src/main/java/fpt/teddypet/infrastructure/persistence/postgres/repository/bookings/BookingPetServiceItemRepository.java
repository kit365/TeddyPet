package fpt.teddypet.infrastructure.persistence.postgres.repository.bookings;

import fpt.teddypet.domain.entity.BookingPetServiceItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookingPetServiceItemRepository extends JpaRepository<BookingPetServiceItem, Long> {

    List<BookingPetServiceItem> findByBookingPetService_Id(Long bookingPetServiceId);
}
