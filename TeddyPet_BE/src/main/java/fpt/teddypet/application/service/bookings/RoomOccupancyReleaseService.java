package fpt.teddypet.application.service.bookings;

import fpt.teddypet.application.port.output.room.RoomRepositoryPort;
import fpt.teddypet.domain.entity.Booking;
import fpt.teddypet.domain.entity.BookingPet;
import fpt.teddypet.domain.entity.BookingPetService;
import fpt.teddypet.domain.enums.RoomStatusEnum;
import fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.BookingPetServiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashSet;
import java.util.Set;

/**
 * Đồng bộ trạng thái vật lý phòng ({@link RoomStatusEnum#OCCUPIED} / {@link RoomStatusEnum#AVAILABLE})
 * với các dòng {@link BookingPetService} có {@code roomId} sau khi hủy hoặc hoàn thành lưu trú.
 */
@Service
@RequiredArgsConstructor
public class RoomOccupancyReleaseService {

    private final BookingPetServiceRepository bookingPetServiceRepository;
    private final RoomRepositoryPort roomRepositoryPort;

    /**
     * Nếu không còn bản ghi nào “đang giữ” phòng (theo {@link BookingPetServiceRepository#existsActiveAssignmentForRoom}),
     * đặt phòng về AVAILABLE khi đang OCCUPIED.
     */
    @Transactional
    public void releaseRoomIfNoActiveAssignment(Long roomId) {
        if (roomId == null) {
            return;
        }
        if (bookingPetServiceRepository.existsActiveAssignmentForRoom(roomId)) {
            return;
        }
        roomRepositoryPort.findById(roomId).ifPresent(room -> {
            if (room.getStatus() == RoomStatusEnum.OCCUPIED) {
                room.setStatus(RoomStatusEnum.AVAILABLE);
                roomRepositoryPort.save(room);
            }
        });
    }

    /**
     * Gọi sau khi booking/dịch vụ chuyển trạng thái kết thúc: thử nhả từng {@code roomId} gắn trên đơn.
     */
    @Transactional
    public void releaseRoomsReferencedByBooking(Booking booking) {
        for (Long roomId : collectDistinctRoomIds(booking)) {
            releaseRoomIfNoActiveAssignment(roomId);
        }
    }

    private static Set<Long> collectDistinctRoomIds(Booking booking) {
        Set<Long> ids = new LinkedHashSet<>();
        if (booking == null || booking.getPets() == null) {
            return ids;
        }
        for (BookingPet pet : booking.getPets()) {
            if (pet == null || pet.getServices() == null) {
                continue;
            }
            for (BookingPetService svc : pet.getServices()) {
                if (svc != null && svc.getRoomId() != null) {
                    ids.add(svc.getRoomId());
                }
            }
        }
        return ids;
    }
}
