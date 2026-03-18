package fpt.teddypet.infrastructure.persistence.postgres.repository.bookings;

import fpt.teddypet.domain.entity.BookingPetService;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface BookingPetServiceRepository extends JpaRepository<BookingPetService, Long> {

    List<BookingPetService> findByBookingPet_Id(Long bookingPetId);

    /**
     * Kiểm tra phòng đã có đặt trùng ngày chưa (giao nhau check-in/check-out).
     * Dùng khi khách bấm hoàn tất: nếu có bản ghi khác đã đặt phòng này trong khoảng ngày đó thì không cho đặt.
     */
    @Query("SELECT COUNT(b) > 0 FROM BookingPetService b WHERE b.roomId = :roomId " +
            "AND b.status <> 'CANCELLED' " +
            "AND b.estimatedCheckInDate <= :checkOut AND b.estimatedCheckOutDate >= :checkIn")
    boolean existsByRoomIdAndOverlappingDates(
            @Param("roomId") Long roomId,
            @Param("checkIn") LocalDate checkIn,
            @Param("checkOut") LocalDate checkOut
    );

    /**
     * Danh sách roomId có đặt phòng trùng khoảng ngày (giao nhau check-in/check-out).
     * Dùng cho client sơ đồ phòng để làm mờ phòng đã được đặt.
     */
    @Query("SELECT DISTINCT b.roomId FROM BookingPetService b WHERE b.roomId IS NOT NULL " +
            "AND b.status <> 'CANCELLED' " +
            "AND b.estimatedCheckInDate <= :checkOut AND b.estimatedCheckOutDate >= :checkIn")
    List<Long> findDistinctRoomIdsWithOverlappingDates(
            @Param("checkIn") LocalDate checkIn,
            @Param("checkOut") LocalDate checkOut
    );
}

