package fpt.teddypet.infrastructure.persistence.postgres.data;

import fpt.teddypet.domain.entity.Room;
import fpt.teddypet.domain.entity.RoomType;
import fpt.teddypet.domain.enums.RoomStatusEnum;
import fpt.teddypet.infrastructure.persistence.postgres.repository.room.RoomRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.room.RoomTypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * Khởi tạo dữ liệu: 2 loại phòng (Phòng thường, VIP) và các phòng (24 phòng
 * thường + 12 phòng VIP).
 * Chỉ tạo khi chưa tồn tại (theo slug cho room_type, theo room_type chưa có
 * phòng cho rooms).
 */
@Slf4j
@Component
@Order(15)
@RequiredArgsConstructor
public class RoomDataInitializer implements CommandLineRunner {

    private final RoomTypeRepository roomTypeRepository;
    private final RoomRepository roomRepository;

    @Value("${data.init.rooms.enabled:true}")
    private boolean enabled;

    private static final String SLUG_PHONG_THUONG = "phong-thuong";
    private static final String SLUG_VIP = "vip";

    @Override
    public void run(String... args) {
        if (!enabled) {
            log.info("Room data init disabled (data.init.rooms.enabled=false)");
            return;
        }
        initRoomTypesAndRooms();
    }

    private void initRoomTypesAndRooms() {
        RoomType phongThuong = createRoomTypeIfNotExists(
                "Phòng thường",
                "Phòng thường",
                SLUG_PHONG_THUONG,
                "Phòng giữ thú cưng tiêu chuẩn",
                "Phòng tiêu chuẩn",
                1,
                24);
        createRoomsIfNone(phongThuong, "P", 24, "Phòng thường %d");

        RoomType vip = createRoomTypeIfNotExists(
                "VIP",
                "Phòng VIP",
                SLUG_VIP,
                "Phòng cao cấp cho thú cưng",
                "Phòng VIP",
                2,
                12);
        createRoomsIfNone(vip, "VIP", 12, "Phòng VIP %d");
    }

    private RoomType createRoomTypeIfNotExists(String typeName, String displayTypeName, String slug,
            String description, String shortDescription,
            int displayOrder, int totalRooms) {
        if (roomTypeRepository.existsBySlug(slug)) {
            return roomTypeRepository.findBySlug(slug).orElseThrow();
        }
        RoomType roomType = RoomType.builder()
                .typeName(typeName)
                .displayTypeName(displayTypeName)
                .slug(slug)
                .description(description)
                .shortDescription(shortDescription)
                .imageUrl(null)
                .basePricePerNight(null)
                .displayOrder(displayOrder)
                .totalRooms(totalRooms)
                .isActive(true)
                .isDeleted(false)
                .build();
        roomType = roomTypeRepository.save(roomType);
        log.info("✅ Created RoomType: {} (slug: {})", typeName, slug);
        return roomType;
    }

    private void createRoomsIfNone(RoomType roomType, String numberPrefix, int count, String nameFormat) {
        if (!roomRepository.findByRoomTypeIdAndIsActiveTrueAndIsDeletedFalse(roomType.getId()).isEmpty()) {
            log.debug("RoomType id={} already has rooms, skipping", roomType.getId());
            return;
        }
        int padWidth = numberPrefix.equals("VIP") ? 2 : 3;
        for (int i = 1; i <= count; i++) {
            String roomNumber = numberPrefix.equals("VIP")
                    ? "VIP" + String.format("%0" + padWidth + "d", i)
                    : "P" + String.format("%0" + padWidth + "d", i);
            String roomName = String.format(nameFormat, i);
            Room room = Room.builder()
                    .roomType(roomType)
                    .roomNumber(roomNumber)
                    .roomName(roomName)
                    .tier(null)
                    .status(RoomStatusEnum.AVAILABLE)
                    .isActive(true)
                    .isDeleted(false)
                    .build();
            roomRepository.save(room);
        }
        log.info("✅ Created {} rooms for RoomType: {} ({})", count, roomType.getTypeName(), roomType.getSlug());
    }
}
