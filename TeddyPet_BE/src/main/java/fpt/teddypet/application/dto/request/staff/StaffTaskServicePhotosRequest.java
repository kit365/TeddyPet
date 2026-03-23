package fpt.teddypet.application.dto.request.staff;

import java.util.List;

public record StaffTaskServicePhotosRequest(
        List<String> beforePhotos,
        List<String> duringPhotos,
        List<String> afterPhotos
) {
}
