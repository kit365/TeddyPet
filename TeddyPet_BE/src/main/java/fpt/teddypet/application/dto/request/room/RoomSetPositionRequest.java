package fpt.teddypet.application.dto.request.room;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RoomSetPositionRequest(
        @NotNull(message = "Layout là bắt buộc")
        Long roomLayoutConfigId,
        @NotNull(message = "Hàng lưới là bắt buộc")
        Integer gridRow,
        @NotNull(message = "Cột lưới là bắt buộc")
        Integer gridCol,
        @NotBlank(message = "Ngăn/Tầng chuồng là bắt buộc")
        @Size(max = 50)
        String tier,
        @NotBlank(message = "Số phòng là bắt buộc")
        @Size(max = 50)
        String roomNumber
) {
}
