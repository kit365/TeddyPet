package fpt.teddypet.infrastructure.persistence.postgres.repository.bookings;

import fpt.teddypet.domain.entity.Booking;
import fpt.teddypet.domain.enums.bookings.BookingTypeEnum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    Optional<Booking> findByBookingCode(String bookingCode);
    List<Booking> findAllByUser_IdOrderByCreatedAtDesc(UUID userId);

    boolean existsByBookingCode(String bookingCode);

    /**
     * Ứng viên cho job hủy tự động no-show: chưa check-in, không phải WALK_IN, trạng thái còn xử lý được.
     */
    @Query("""
            select distinct b.id from Booking b
            where b.isDeleted = false
            and (b.bookingType is null or b.bookingType <> :walkIn)
            and b.status in ('PENDING', 'CONFIRMED', 'READY')
            and b.bookingCheckInDate is null
            """)
    List<Long> findIdsEligibleForNoShowAutoCancel(@Param("walkIn") BookingTypeEnum walkIn);

    /**
     * Chỉ fetch {@code pets} — không fetch {@code BookingPet.services} trong cùng query
     * (tránh {@code MultipleBagFetchException}: hai List/bag không được join fetch đồng thời).
     * Dịch vụ: dùng {@link fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.BookingPetServiceRepository#findAllByBookingIdWithServiceAndNoShow}.
     */
    @Query("""
            select distinct b from Booking b
            left join fetch b.pets
            where b.id = :id
            """)
    Optional<Booking> findByIdWithPetsFetch(@Param("id") Long id);
}

