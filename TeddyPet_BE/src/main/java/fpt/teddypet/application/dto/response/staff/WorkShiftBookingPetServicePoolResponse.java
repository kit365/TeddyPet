package fpt.teddypet.application.dto.response.staff;

import java.util.List;

public record WorkShiftBookingPetServicePoolResponse(
        List<WorkShiftBookingPetServiceItemResponse> inWeek,
        List<WorkShiftBookingPetServiceItemResponse> waiting
) {
}
