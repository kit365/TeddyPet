package fpt.teddypet.application.dto.request.bookings;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Schema(description = "Request cập nhật ghi chú nội bộ của booking")
public class UpdateBookingInternalNotesRequest {
    @Schema(description = "Nội dung ghi chú nội bộ")
    String internalNotes;
}
