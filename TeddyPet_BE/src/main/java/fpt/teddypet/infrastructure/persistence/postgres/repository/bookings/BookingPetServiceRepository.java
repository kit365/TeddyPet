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
    @Query("SELECT COUNT(bps) > 0 FROM BookingPetService bps " +
            "JOIN bps.bookingPet bp " +
            "JOIN bp.booking bk " +
            "WHERE bps.roomId = :roomId " +
            "AND bps.status <> 'CANCELLED' " +
            "AND bk.status <> 'CANCELLED' " +
            "AND (bk.status <> 'PENDING' OR EXISTS (" +
            "  SELECT 1 FROM BookingDeposit bd WHERE bd.bookingId = bk.id AND bd.depositPaid = true" +
            ")) " +
            "AND bps.estimatedCheckInDate <= :checkOut AND bps.estimatedCheckOutDate >= :checkIn")
    boolean existsByRoomIdAndOverlappingDates(
            @Param("roomId") Long roomId,
            @Param("checkIn") LocalDate checkIn,
            @Param("checkOut") LocalDate checkOut
    );

    /**
     * Danh sách roomId có đặt phòng trùng khoảng ngày (giao nhau check-in/check-out).
     * Dùng cho client sơ đồ phòng để làm mờ phòng đã được đặt.
     */
    @Query("SELECT DISTINCT bps.roomId FROM BookingPetService bps " +
            "JOIN bps.bookingPet bp " +
            "JOIN bp.booking bk " +
            "WHERE bps.roomId IS NOT NULL " +
            "AND bps.status <> 'CANCELLED' " +
            "AND bk.status <> 'CANCELLED' " +
            "AND (bk.status <> 'PENDING' OR EXISTS (" +
            "  SELECT 1 FROM BookingDeposit bd WHERE bd.bookingId = bk.id AND bd.depositPaid = true" +
            ")) " +
            "AND bps.estimatedCheckInDate <= :checkOut AND bps.estimatedCheckOutDate >= :checkIn")
    List<Long> findDistinctRoomIdsWithOverlappingDates(
            @Param("checkIn") LocalDate checkIn,
            @Param("checkOut") LocalDate checkOut
    );
    /**
     * Danh sách roomId đang có khách lưu trú thực tế:
     * - booking đã check-in, chưa check-out
     * - booking đang IN_PROGRESS
     * - booking có ít nhất 1 bản ghi depositPaid = true
     */
    @Query("SELECT DISTINCT bps.roomId FROM BookingPetService bps " +
           "JOIN bps.bookingPet bp " +
           "JOIN bp.booking b " +
           "WHERE bps.roomId IS NOT NULL " +
           "AND bps.status <> 'CANCELLED' " +
           "AND b.status = 'IN_PROGRESS' " +
           "AND b.bookingCheckInDate IS NOT NULL " +
           "AND b.bookingCheckOutDate IS NULL " +
           "AND EXISTS (" +
           "  SELECT 1 FROM BookingDeposit bd " +
           "  WHERE bd.bookingId = b.id " +
           "    AND bd.depositPaid = true" +
           ")")
    List<Long> findDistinctOccupiedRoomIdsForActiveStay();

    /**
     * Còn ít nhất một dòng dịch vụ gắn phòng mà booking và dịch vụ đều chưa CANCELLED.
     * Dùng để phân biệt OCCUPIED do giữ chỗ thật vs. trạng thái kẹt sau khi đã hủy/hết hạn.
     */
    @Query("SELECT COUNT(bps) > 0 FROM BookingPetService bps " +
            "JOIN bps.bookingPet bp " +
            "JOIN bp.booking bk " +
            "WHERE bps.roomId = :roomId " +
            "AND bps.status <> 'CANCELLED' " +
            "AND bk.status <> 'CANCELLED'")
    boolean existsActiveAssignmentForRoom(@Param("roomId") Long roomId);
    /**
     * Lấy các lịch hẹn dịch vụ của ngày hôm nay cho nhân viên, từ các booking đã check-in và paid.
     */
    @Query("SELECT bps FROM BookingPetService bps " +
           "JOIN FETCH bps.bookingPet bp " +
           "JOIN FETCH bp.booking b " +
           "LEFT JOIN FETCH bps.service s " +
           "LEFT JOIN FETCH bps.serviceCombo c " +
           "WHERE b.status = 'IN_PROGRESS' " +
           "AND b.paidAmount > 0 " +
           "AND b.bookingDateFrom = :today")
    List<BookingPetService> findTodayTasksForStaff(@Param("today") LocalDate today);

    /**
     * Lấy booking_pet_services cho nhân viên theo ca đã khóa (ASSIGNED) trong ngày.
     * booking_pet_services được coi là thuộc ca khi scheduledStart/End trùng start/end của ca.
     */
    @Query("SELECT DISTINCT bps FROM BookingPetService bps " +
            "JOIN FETCH bps.bookingPet bp " +
            "JOIN FETCH bp.booking b " +
            "LEFT JOIN FETCH bps.service s " +
            "LEFT JOIN FETCH bps.serviceCombo c " +
            "WHERE bps.scheduledStartTime IS NOT NULL " +
            "AND bps.scheduledEndTime IS NOT NULL " +
            "AND bps.scheduledStartTime >= :dayStart " +
            "AND bps.scheduledStartTime < :dayEnd " +
            "AND (bps.status IS NULL OR UPPER(bps.status) <> 'CANCELLED') " +
            "AND EXISTS (" +
            "   SELECT 1 FROM WorkShiftRegistration reg " +
            "   JOIN reg.workShift ws " +
            "   WHERE reg.staff.id = :staffId " +
            "   AND reg.status = :registrationStatus " +
            "   AND ws.status = :shiftStatus " +
            "   AND ws.startTime = bps.scheduledStartTime " +
            "   AND ws.endTime = bps.scheduledEndTime" +
            ") " +
            "ORDER BY bps.scheduledStartTime ASC, bps.id ASC")
    List<BookingPetService> findTasksForStaffByAssignedShiftsInDay(
            @Param("staffId") Long staffId,
            @Param("dayStart") java.time.LocalDateTime dayStart,
            @Param("dayEnd") java.time.LocalDateTime dayEnd,
            @Param("registrationStatus") fpt.teddypet.domain.enums.staff.RegistrationStatus registrationStatus,
            @Param("shiftStatus") fpt.teddypet.domain.enums.staff.ShiftStatus shiftStatus
    );

    @Query("SELECT COALESCE(AVG(bps.customerRating), 0) FROM BookingPetService bps " +
            "WHERE bps.customerRating IS NOT NULL AND bps.customerRating > 0")
    Double getAverageCustomerRating();

    @Query("SELECT COUNT(bps) FROM BookingPetService bps " +
            "WHERE bps.customerRating IS NOT NULL AND bps.customerRating > 0")
    long countWithCustomerRating();

    @Query("SELECT bps.id, b.bookingCode, b.customerName, COALESCE(s.serviceName, c.comboName), " +
            "bps.customerRating, bps.customerReview, bps.updatedAt " +
            "FROM BookingPetService bps " +
            "JOIN bps.bookingPet bp " +
            "JOIN bp.booking b " +
            "LEFT JOIN bps.service s " +
            "LEFT JOIN bps.serviceCombo c " +
            "WHERE bps.customerRating IS NOT NULL AND bps.customerRating > 0 " +
            "ORDER BY bps.updatedAt DESC")
    List<Object[]> findAllBookingReviews();

    @Query("SELECT DISTINCT bps FROM BookingPetService bps " +
            "JOIN FETCH bps.bookingPet bp " +
            "JOIN FETCH bp.booking b " +
            "LEFT JOIN FETCH bps.service s " +
            "LEFT JOIN FETCH bps.serviceCombo c " +
            "WHERE b.status = 'CONFIRMED' " +
            "AND (bps.status IS NULL OR UPPER(bps.status) <> 'CANCELLED') " +
            "AND EXISTS (" +
            "  SELECT 1 FROM BookingDeposit bd WHERE bd.bookingId = b.id AND bd.depositPaid = true" +
            ") " +
            "ORDER BY b.createdAt DESC")
    List<BookingPetService> findAssignableForWorkShift();

    @Query("SELECT COUNT(bps) > 0 FROM BookingPetService bps " +
            "JOIN bps.bookingPet bp " +
            "JOIN bp.booking b " +
            "WHERE bps.id = :bookingPetServiceId " +
            "AND b.status = 'CONFIRMED' " +
            "AND (bps.status IS NULL OR UPPER(bps.status) <> 'CANCELLED') " +
            "AND EXISTS (" +
            "  SELECT 1 FROM BookingDeposit bd WHERE bd.bookingId = b.id AND bd.depositPaid = true" +
            ")")
    boolean isEligibleForWorkShiftAssignment(@Param("bookingPetServiceId") Long bookingPetServiceId);
}
