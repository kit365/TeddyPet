package fpt.teddypet.application.dto.request.room;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RoomLayoutConfigUpsertRequest(
        Long id,
        @Size(max = 255)
        String layoutName,
        @Size(max = 100)
        String block,
        @NotNull(message = "maxRows là bắt buộc")
        @Min(1) @Max(100)
        Integer maxRows,
        @NotNull(message = "maxCols là bắt buộc")
        @Min(1) @Max(100)
        Integer maxCols,
        @Size(max = 500)
        String backgroundImage
) {
}
