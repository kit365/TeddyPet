package fpt.teddypet.application.port.input.bookings;

import fpt.teddypet.application.dto.request.bookings.UpsertNoShowConfigRequest;
import fpt.teddypet.application.dto.response.bookings.NoShowConfigResponse;

public interface NoShowConfigAdminService {

    /**
     * Lấy cấu hình NO-SHOW hiện tại (nếu chưa có sẽ trả về null).
     */
    NoShowConfigResponse getCurrent();

    /**
     * Tạo mới hoặc cập nhật cấu hình NO-SHOW (hệ thống chỉ dùng 1 bản ghi global).
     */
    NoShowConfigResponse upsert(UpsertNoShowConfigRequest request);
}

