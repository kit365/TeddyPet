package fpt.teddypet.application.dto.request.promotions;

import fpt.teddypet.domain.enums.promotions.DiscountTypeEnum;
import fpt.teddypet.domain.enums.promotions.PromotionScopeEnum;
import fpt.teddypet.domain.enums.promotions.PromotionStatusEnum;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record PromotionRequest(
        @NotBlank(message = "Mã khuyến mãi là bắt buộc")
        @Size(max = 50, message = "Mã khuyến mãi không được vượt quá 50 ký tự")
        String code,

        @NotBlank(message = "Tên khuyến mãi là bắt buộc")
        @Size(max = 200, message = "Tên khuyến mãi không được vượt quá 200 ký tự")
        String name,

        @Size(max = 500, message = "URL thumbnail không được vượt quá 500 ký tự")
        String thumbnail,

        @NotNull(message = "Loại giảm giá là bắt buộc")
        DiscountTypeEnum discountType,

        @NotNull(message = "Giá trị giảm giá là bắt buộc")
        @DecimalMin(value = "0.0", inclusive = false, message = "Giá trị giảm giá phải lớn hơn 0")
        BigDecimal discountValue,

        @DecimalMin(value = "0.0", inclusive = false, message = "Số tiền giảm tối đa phải lớn hơn 0")
        BigDecimal maxDiscountAmount,

        @DecimalMin(value = "0.0", inclusive = false, message = "Số tiền đơn hàng tối thiểu phải lớn hơn 0")
        BigDecimal minOrderAmount,

        @NotNull(message = "Ngày bắt đầu là bắt buộc")
        LocalDateTime startDate,

        @NotNull(message = "Ngày kết thúc là bắt buộc")
        LocalDateTime endDate,

        @Min(value = 1, message = "Giới hạn sử dụng phải lớn hơn 0")
        Integer usageLimit,

        @Min(value = 1, message = "Giới hạn sử dụng mỗi người dùng phải lớn hơn 0")
        Integer usageLimitPerUser,

        @NotNull(message = "Phạm vi áp dụng là bắt buộc")
        PromotionScopeEnum scope,

        @NotNull(message = "Trạng thái là bắt buộc")
        PromotionStatusEnum status,

        List<Long> applyProducts,

        List<Long> applyCategories
) {
}
