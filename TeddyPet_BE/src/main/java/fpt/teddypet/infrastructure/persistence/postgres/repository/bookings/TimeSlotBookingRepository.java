package fpt.teddypet.infrastructure.persistence.postgres.repository.bookings;

import fpt.teddypet.domain.entity.TimeSlotBooking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TimeSlotBookingRepository extends JpaRepository<TimeSlotBooking, Long> {

    /**
     * Tìm time slot booking theo bookingPetServiceId
     */
    Optional<TimeSlotBooking> findByBookingPetService_Id(Long bookingPetServiceId);

    /**
     * Tìm tất cả time slot bookings cho một ngày và khung giờ cụ thể
     */
    @Query("""
            SELECT t FROM TimeSlotBooking t
            WHERE t.bookingDate = :bookingDate
            AND t.timeSlot.id = :timeSlotId
            AND t.status = 'PENDING'
            """)
    List<TimeSlotBooking> findByBookingDateAndTimeSlot(
            @Param("bookingDate") LocalDate bookingDate,
            @Param("timeSlotId") Long timeSlotId
    );

    /**
     * Kiểm tra có booking trùng khung giờ trong ngày không (để validate capacity)
     */
    @Query("""
            SELECT COUNT(t) FROM TimeSlotBooking t
            WHERE t.bookingDate = :bookingDate
            AND t.timeSlot.id = :timeSlotId
            AND t.status = 'PENDING'
            """)
    int countByBookingDateAndTimeSlot(
            @Param("bookingDate") LocalDate bookingDate,
            @Param("timeSlotId") Long timeSlotId
    );

    /**
     * Tìm time slot bookings theo service và ngày để kiểm tra hold
     */
    @Query("""
            SELECT t FROM TimeSlotBooking t
            WHERE t.service.id = :serviceId
            AND t.bookingDate = :bookingDate
            AND t.status IN ('PENDING', 'HELD')
            """)
    List<TimeSlotBooking> findByServiceAndBookingDate(
            @Param("serviceId") Long serviceId,
            @Param("bookingDate") LocalDate bookingDate
    );

    /**
     * Xóa time slot booking theo bookingPetServiceId
     */
    void deleteByBookingPetService_Id(Long bookingPetServiceId);

    /**
     * Xóa tất cả time slot bookings liên quan đến booking ID (khi booking expires/cancelled)
     */
    @Modifying
    @Query("""
            DELETE FROM TimeSlotBooking t
            WHERE t.bookingPetService.bookingPet.booking.id = :bookingId
            """)
    void deleteByBookingPetService_Booking_Id(@Param("bookingId") Long bookingId);
}
