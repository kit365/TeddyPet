package fpt.teddypet.infrastructure.persistence.postgres.data;

import fpt.teddypet.domain.entity.Room;
import fpt.teddypet.domain.entity.RoomLayoutConfig;
import fpt.teddypet.domain.entity.Service;
import fpt.teddypet.domain.enums.RoomLayoutStatusEnum;
import fpt.teddypet.infrastructure.persistence.postgres.repository.room.RoomLayoutConfigRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.room.RoomRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.services.ServiceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Gán vị trí (grid_row, grid_col, tier) cho các phòng trên layout "Phòng Chuồng"
 * theo sơ đồ test: P001–P012 và VIP01–VIP12 đặt trên lưới 10x10.
 * Chỉ chạy khi layout đã có và các phòng chưa được sắp vào layout đó.
 */
@Slf4j
@Component
@Order(16)
@RequiredArgsConstructor
public class RoomLayoutPositionInitializer implements CommandLineRunner {

    private static final String SERVICE_CODE_PHONG_CHUONG = "HOTEL-PHONG-CHUONG";

    /** (room_number, grid_row, grid_col, tier) — grid 0-based */
    private static final List<RoomPositionDef> POSITIONS = List.of(
            // Hàng 0: P001–P004
            def("P001", 0, 5, "1"),
            def("P002", 0, 6, "1"),
            def("P003", 0, 7, "1"),
            def("P004", 0, 8, "1"),
            // Hàng 1: P005–P008
            def("P005", 1, 5, "1"),
            def("P006", 1, 6, "1"),
            def("P007", 1, 7, "1"),
            def("P008", 1, 8, "1"),
            // Hàng 2: P009–P012
            def("P009", 2, 5, "1"),
            def("P010", 2, 6, "1"),
            def("P011", 2, 7, "1"),
            def("P012", 2, 8, "1"),
            // VIP: hàng 4–7
            def("VIP01", 4, 2, "1"),
            def("VIP02", 4, 3, "1"),
            def("VIP03", 4, 4, "1"),
            def("VIP04", 5, 2, "1"),
            def("VIP05", 5, 3, "1"),
            def("VIP06", 5, 4, "1"),
            def("VIP07", 6, 2, "1"),
            def("VIP08", 6, 3, "1"),
            def("VIP09", 6, 4, "1"),
            def("VIP10", 7, 2, "1"),
            def("VIP11", 7, 3, "1"),
            def("VIP12", 7, 4, "1")
    );

    private final ServiceRepository serviceRepository;
    private final RoomLayoutConfigRepository roomLayoutConfigRepository;
    private final RoomRepository roomRepository;

    @Value("${data.init.room-layout-positions.enabled:true}")
    private boolean enabled;

    @Override
    public void run(String... args) {
        if (!enabled) {
            log.debug("Room layout position init disabled");
            return;
        }
        serviceRepository.findByCode(SERVICE_CODE_PHONG_CHUONG).ifPresent(this::assignPositionsForService);
    }

    private void assignPositionsForService(Service service) {
        List<RoomLayoutConfig> layouts = roomLayoutConfigRepository.findByService_IdOrderByIdAsc(service.getId());
        if (layouts.isEmpty()) {
            log.debug("No room layout config for service {}, skip position init", service.getServiceName());
            return;
        }
        RoomLayoutConfig layout = layouts.get(0);

        List<Room> allRooms = roomRepository.findByIsActiveTrueAndIsDeletedFalse();
        Map<String, Room> byNumber = allRooms.stream()
                .filter(r -> r.getRoomNumber() != null)
                .collect(Collectors.toMap(Room::getRoomNumber, r -> r, (a, b) -> a));

        int updated = 0;
        for (RoomPositionDef pos : POSITIONS) {
            Room room = byNumber.get(pos.roomNumber());
            if (room == null) continue;
            if (room.getRoomLayoutConfig() != null && layout.getId().equals(room.getRoomLayoutConfig().getId())) {
                continue;
            }
            room.setRoomLayoutConfig(layout);
            room.setGridRow(pos.gridRow());
            room.setGridCol(pos.gridCol());
            room.setTier(pos.tier());
            room.setIsSorted(true);
            roomRepository.save(room);
            updated++;
        }
        if (updated > 0) {
            long placedCount = roomRepository.findByRoomLayoutConfig_IdAndIsActiveTrueAndIsDeletedFalseOrderByGridRowAscGridColAsc(layout.getId()).size();
            if (placedCount > 1 && layout.getStatus() == RoomLayoutStatusEnum.NO_ROOMS_IS_SORTED) {
                layout.setStatus(RoomLayoutStatusEnum.READY_FOR_USE);
                roomLayoutConfigRepository.save(layout);
            }
            log.info("✅ Room layout position init: assigned {} rooms to layout \"{}\" (service: {})",
                    updated, layout.getLayoutName(), service.getServiceName());
        }
    }

    private static RoomPositionDef def(String roomNumber, int gridRow, int gridCol, String tier) {
        return new RoomPositionDef(roomNumber, gridRow, gridCol, tier);
    }

    private record RoomPositionDef(String roomNumber, int gridRow, int gridCol, String tier) {}
}
