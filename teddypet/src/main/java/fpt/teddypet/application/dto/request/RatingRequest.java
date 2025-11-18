package fpt.teddypet.application.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record RatingRequest(
        @NotNull(message = "ID sản phẩm là bắt buộc")
        Long productId,

        @NotNull(message = "Điểm đánh giá là bắt buộc")
        @DecimalMin(value = "1.0", message = "Điểm đánh giá phải từ 1.0")
        @DecimalMax(value = "5.0", message = "Điểm đánh giá không được vượt quá 5.0")
        BigDecimal score,

        @Size(max = 2000, message = "Bình luận không được vượt quá 2000 ký tự")
        String comment,

        Boolean isVerifiedPurchase
) {
}

