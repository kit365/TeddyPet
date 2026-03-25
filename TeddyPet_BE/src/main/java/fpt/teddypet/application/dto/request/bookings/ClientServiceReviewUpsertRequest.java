package fpt.teddypet.application.dto.request.bookings;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ClientServiceReviewUpsertRequest(
        @NotNull(message = "customerRating là bắt buộc")
        @Min(value = 1, message = "customerRating phải từ 1 đến 5")
        @Max(value = 5, message = "customerRating phải từ 1 đến 5")
        Integer customerRating,

        @Size(max = 2000, message = "customerReview tối đa 2000 ký tự")
        String customerReview,

        java.util.List<String> customerPhotos
) {
}
